<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Http\Traits\ApiResponse;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    use ApiResponse;

    /** GET /v1/orders */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['items', 'table:id,name', 'cashier:id,name'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('order_type')) {
            $query->where('order_type', $request->order_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $orders = $query->paginate($request->integer('per_page', 20));

        return $this->paginated($orders);
    }

    /** POST /v1/orders */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $user       = $request->user();
        $restaurant = $user->restaurant;

        // Validate all items belong to this restaurant and are available
        $menuItemIds = collect($request->items)->pluck('menu_item_id')->unique();

        $menuItems = MenuItem::where('restaurant_id', $restaurant->id)
            ->where('is_available', true)
            ->whereIn('id', $menuItemIds)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            return $this->error('Beberapa item menu tidak tersedia atau tidak ditemukan.', 422);
        }

        // Validate table belongs to restaurant (if provided)
        if ($request->filled('table_id')) {
            $tableExists = RestaurantTable::where('id', $request->table_id)
                ->where('restaurant_id', $restaurant->id)
                ->exists();

            if (! $tableExists) {
                return $this->error('Meja tidak ditemukan.', 422);
            }
        }

        // Build order items + calculate totals
        $subtotal       = 0;
        $orderItemsData = [];

        foreach ($request->items as $item) {
            $menuItem     = $menuItems[$item['menu_item_id']];
            $qty          = (int) $item['quantity'];
            $lineTotal    = $menuItem->price * $qty;
            $subtotal    += $lineTotal;

            $orderItemsData[] = [
                'menu_item_id'   => $menuItem->id,
                'menu_item_name' => $menuItem->name,
                'quantity'       => $qty,
                'price_snapshot' => $menuItem->price,
                'subtotal'       => $lineTotal,
                'notes'          => $item['notes'] ?? null,
            ];
        }

        $orderNumber = $this->generateOrderNumber($restaurant->id);

        $order = DB::transaction(function () use (
            $request,
            $restaurant,
            $orderNumber,
            $subtotal,
            $orderItemsData,
            $user
        ) {
            $order = Order::create([
                'restaurant_id'   => $restaurant->id,
                'order_number'    => $orderNumber,
                'table_id'        => $request->table_id,
                'cashier_id'      => $user->id,
                'order_type'      => $request->order_type,
                'status'          => 'pending',
                'notes'           => $request->notes,
                'customer_name'   => $request->customer_name,
                'subtotal'        => $subtotal,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total'           => $subtotal,
                'payment_status'  => 'unpaid',
            ]);

            $order->items()->createMany($orderItemsData);

            return $order;
        });

        return $this->created(
            $order->load(['items', 'table:id,name', 'cashier:id,name']),
            'Pesanan berhasil dibuat.'
        );
    }

    /** GET /v1/orders/{order} */
    public function show(Order $order): JsonResponse
    {
        return $this->success(
            $order->load(['items', 'table:id,name', 'cashier:id,name', 'payment'])
        );
    }

    /** PATCH /v1/orders/{order}/status */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $newStatus = $request->status;
        $allowed   = $order->allowedNextStatuses();

        if (! in_array($newStatus, $allowed)) {
            return $this->error(
                "Tidak dapat mengubah status dari '{$order->status}' ke '{$newStatus}'.",
                422
            );
        }

        $order->update(['status' => $newStatus]);

        return $this->success(
            $order->fresh(['items', 'table:id,name', 'cashier:id,name']),
            'Status pesanan diperbarui.'
        );
    }

    /** DELETE /v1/orders/{order} — soft-cancel */
    public function destroy(Order $order): JsonResponse
    {
        if (! $order->isCancellable()) {
            return $this->error(
                'Pesanan tidak dapat dibatalkan (sudah dibayar atau sedang diproses).',
                422
            );
        }

        $order->update(['status' => 'cancelled']);

        return $this->noContent('Pesanan berhasil dibatalkan.');
    }

    /* ─────────── helpers ─────────── */

    private function generateOrderNumber(int $restaurantId): string
    {
        $date   = now()->format('Ymd');
        $prefix = "ORD-{$date}-";

        $last = Order::where('restaurant_id', $restaurantId)
            ->where('order_number', 'like', "{$prefix}%")
            ->orderByDesc('order_number')
            ->value('order_number');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
