<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicMenuController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/{slug}/menu
     * Public endpoint — no authentication required.
     * Returns the full active menu for a restaurant identified by slug.
     */
    public function menu(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $restaurant) {
            return $this->error('Restoran tidak ditemukan.', 404);
        }

        // Categories with active items only
        $categories = MenuCategory::where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->with([
                'activeMenuItems' => function ($q) {
                    $q->orderBy('sort_order')->orderBy('name');
                },
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->filter(fn($c) => $c->activeMenuItems->isNotEmpty())
            ->values();

        // Table info (if ?table=id provided)
        $tableInfo = null;
        if ($request->filled('table')) {
            $tableInfo = RestaurantTable::where('id', $request->table)
                ->where('restaurant_id', $restaurant->id)
                ->where('is_active', true)
                ->first(['id', 'name', 'capacity', 'status']);
        }

        return $this->success([
            'restaurant' => [
                'name'     => $restaurant->name,
                'slug'     => $restaurant->slug,
                'logo_url' => $restaurant->logo_url,
                'timezone' => $restaurant->timezone,
                'currency' => $restaurant->currency,
            ],
            'table'      => $tableInfo,
            'categories' => $categories,
        ]);
    }

    /**
     * POST /api/v1/public/{slug}/orders
     * Guest-facing order creation — no authentication required.
     */
    public function createOrder(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $restaurant) {
            return $this->error('Restoran tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'table_id'      => ['nullable', 'integer', 'exists:restaurant_tables,id'],
            'order_type'    => ['required', 'in:dine_in,take_away,delivery'],
            'notes'         => ['nullable', 'string', 'max:500'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes'        => ['nullable', 'string', 'max:255'],
        ]);

        // Validate all items belong to this restaurant
        $menuItemIds = collect($validated['items'])->pluck('menu_item_id')->unique();

        $menuItems = MenuItem::where('restaurant_id', $restaurant->id)
            ->where('is_available', true)
            ->whereIn('id', $menuItemIds)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== $menuItemIds->count()) {
            return $this->error('Beberapa item menu tidak tersedia.', 422);
        }

        // Validate table if provided
        if (! empty($validated['table_id'])) {
            $tableExists = RestaurantTable::where('id', $validated['table_id'])
                ->where('restaurant_id', $restaurant->id)
                ->exists();

            if (! $tableExists) {
                return $this->error('Meja tidak ditemukan.', 422);
            }
        }

        // Build items
        $subtotal       = 0;
        $orderItemsData = [];

        foreach ($validated['items'] as $item) {
            $menuItem  = $menuItems[$item['menu_item_id']];
            $qty       = (int) $item['quantity'];
            $lineTotal = $menuItem->price * $qty;
            $subtotal += $lineTotal;

            $orderItemsData[] = [
                'menu_item_id'   => $menuItem->id,
                'menu_item_name' => $menuItem->name,
                'quantity'       => $qty,
                'price_snapshot' => $menuItem->price,
                'subtotal'       => $lineTotal,
                'notes'          => $item['notes'] ?? null,
            ];
        }

        // Generate order number
        $date        = now()->format('Ymd');
        $prefix      = "ORD-{$date}-";
        $last        = Order::where('restaurant_id', $restaurant->id)
            ->where('order_number', 'like', "{$prefix}%")
            ->orderByDesc('order_number')
            ->value('order_number');
        $seq         = $last ? ((int) substr($last, -4)) + 1 : 1;
        $orderNumber = $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);

        $order = DB::transaction(function () use (
            $validated,
            $restaurant,
            $orderNumber,
            $subtotal,
            $orderItemsData
        ) {
            $order = Order::create([
                'restaurant_id'   => $restaurant->id,
                'order_number'    => $orderNumber,
                'table_id'        => $validated['table_id'] ?? null,
                'order_type'      => $validated['order_type'],
                'status'          => 'pending',
                'notes'           => $validated['notes'] ?? null,
                'customer_name'   => $validated['customer_name'] ?? null,
                'subtotal'        => $subtotal,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total'           => $subtotal,
                'payment_status'  => 'unpaid',
                'public_token'    => Str::random(32),
            ]);

            $order->items()->createMany($orderItemsData);

            return $order;
        });

        return $this->created([
            'order_number' => $order->order_number,
            'public_token' => $order->public_token,
            'status'       => $order->status,
            'total'        => $order->total,
            'items_count'  => $order->items()->count(),
        ], 'Pesanan berhasil dikirim!');
    }
}
