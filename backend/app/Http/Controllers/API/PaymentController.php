<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Traits\ApiResponse;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(private MidtransService $midtrans) {}

    /* ─────────────────────────────────────────────────
     | POST /v1/payments
     | Process a cash / manual payment for an order.
     ───────────────────────────────────────────────── */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $order = Order::with(['table', 'payment'])->find($request->order_id);

        // Ensure order belongs to this restaurant
        if ($order->restaurant_id !== $request->user()->restaurant_id) {
            return $this->error('Pesanan tidak ditemukan.', 404);
        }

        // Guard: already paid
        if ($order->payment_status === 'paid') {
            return $this->error('Pesanan ini sudah dibayar.', 422);
        }

        // Guard: can only pay orders that are ready or completed (not cancelled/pending)
        if (in_array($order->status, ['cancelled'])) {
            return $this->error('Pesanan yang dibatalkan tidak dapat dibayar.', 422);
        }

        $amount       = (float) $request->amount;
        $total        = (float) $order->total;
        $method       = $request->input('method');
        $changeAmount = $method === 'cash' ? max(0, $amount - $total) : 0;

        // For cash: amount must be >= total
        if ($method === 'cash' && $amount < $total) {
            return $this->error(
                'Jumlah uang yang diterima kurang. Perlu: ' . number_format($total, 0, ',', '.'),
                422
            );
        }

        try {
            DB::transaction(function () use ($order, $request, $amount, $changeAmount, $method) {
                // Delete existing failed/pending payment if any
                $order->payment?->delete();

                // Record payment
                Payment::create([
                    'order_id'        => $order->id,
                    'cashier_id'      => $request->user()->id,
                    'method'          => $method,
                    'amount'          => $amount,
                    'change_amount'   => $changeAmount,
                    'status'          => 'paid',
                    'transaction_ref' => $request->transaction_ref,
                    'notes'           => $request->notes,
                    'paid_at'         => now(),
                ]);

                // Mark order as paid & completed
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => 'completed',
                    'cashier_id'     => $request->user()->id,
                ]);

                // Free the table (dine-in only)
                if ($order->order_type === 'dine_in' && $order->table_id) {
                    $order->table()->update(['status' => 'available']);
                }
            });
        } catch (\Throwable $e) {
            Log::error('Payment store failed', ['error' => $e->getMessage(), 'order' => $order->id]);
            return $this->error('Gagal memproses pembayaran. Coba lagi.', 500);
        }

        $order->refresh()->load(['payment', 'items', 'table', 'cashier']);

        return $this->success($order, 'Pembayaran berhasil diproses.', 201);
    }

    /* ─────────────────────────────────────────────────
     | GET /v1/payments/{payment}
     ───────────────────────────────────────────────── */
    public function show(Payment $payment, Request $request): JsonResponse
    {
        $payment->load(['order.items', 'order.table', 'cashier']);

        // Scope check
        if ($payment->order->restaurant_id !== $request->user()->restaurant_id) {
            return $this->error('Tidak ditemukan.', 404);
        }

        return $this->success($payment);
    }

    /* ─────────────────────────────────────────────────
     | PATCH /v1/payments/{payment}/refund
     | Owner only
     ───────────────────────────────────────────────── */
    public function refund(Payment $payment, Request $request): JsonResponse
    {
        if ($payment->order->restaurant_id !== $request->user()->restaurant_id) {
            return $this->error('Tidak ditemukan.', 404);
        }

        if (! $payment->isPaid()) {
            return $this->error('Hanya pembayaran yang sudah lunas yang dapat direfund.', 422);
        }

        DB::transaction(function () use ($payment) {
            $payment->update([
                'status' => 'refunded',
            ]);

            $payment->order->update([
                'payment_status' => 'refunded',
            ]);
        });

        return $this->success($payment->fresh(), 'Refund berhasil dicatat.');
    }

    /* ─────────────────────────────────────────────────
     | GET /v1/payments/history
     | List all payments for this restaurant
     ───────────────────────────────────────────────── */
    public function history(Request $request): JsonResponse
    {
        $query = Payment::whereHas('order', function ($q) use ($request) {
            $q->where('restaurant_id', $request->user()->restaurant_id);
        })
            ->with(['order:id,order_number,order_type,total,table_id', 'cashier:id,name'])
            ->latest('paid_at');

        if ($request->filled('method')) {
            $query->where('method', $request->input('method'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date')) {
            $query->whereDate('paid_at', $request->date);
        }

        $payments = $query->paginate($request->integer('per_page', 20));

        return $this->paginated($payments);
    }

    /* ─────────────────────────────────────────────────
     | POST /v1/payments/midtrans/snap-token
     | Get Snap token for QRIS / digital payments
     ───────────────────────────────────────────────── */
    public function snapToken(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $order = Order::with(['items', 'restaurant', 'payment'])->find($request->order_id);

        if ($order->restaurant_id !== $request->user()->restaurant_id) {
            return $this->error('Pesanan tidak ditemukan.', 404);
        }

        if ($order->payment_status === 'paid') {
            return $this->error('Pesanan ini sudah dibayar.', 422);
        }

        try {
            $result = $this->midtrans->createSnapToken($order);
            return $this->success($result);
        } catch (\Throwable $e) {
            Log::error('Midtrans snap token failed', ['error' => $e->getMessage(), 'order' => $order->id]);
            return $this->error('Gagal membuat token pembayaran: ' . $e->getMessage(), 500);
        }
    }

    /* ─────────────────────────────────────────────────
     | POST /v1/payments/midtrans/notification
     | Midtrans webhook — no auth, verified via signature
     ───────────────────────────────────────────────── */
    public function notification(): JsonResponse
    {
        try {
            $notification = $this->midtrans->parseNotification();

            $orderId         = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus     = $notification->fraud_status ?? '';
            $transactionRef  = $notification->transaction_id ?? null;
            $paymentType     = $notification->payment_type ?? 'qris';
            $grossAmount     = (float) ($notification->gross_amount ?? 0);

            // Extract our order number (we append -timestamp to order_id)
            $orderNumber = explode('-', $orderId);
            // Remove last segment (timestamp)
            array_pop($orderNumber);
            $orderNumber = implode('-', $orderNumber);

            $order = Order::where('order_number', $orderNumber)->first();

            if (! $order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            $status = $this->midtrans->resolveStatus($transactionStatus, $fraudStatus);

            DB::transaction(function () use ($order, $status, $transactionRef, $paymentType, $grossAmount) {
                if ($status === 'paid') {
                    // Upsert payment record
                    Payment::updateOrCreate(
                        ['order_id' => $order->id],
                        [
                            'cashier_id'      => null,
                            'method'          => $this->mapPaymentType($paymentType),
                            'amount'          => $grossAmount,
                            'change_amount'   => 0,
                            'status'          => 'paid',
                            'transaction_ref' => $transactionRef,
                            'paid_at'         => now(),
                        ]
                    );

                    $order->update([
                        'payment_status' => 'paid',
                        'status'         => 'completed',
                    ]);

                    // Free the table
                    if ($order->order_type === 'dine_in' && $order->table_id) {
                        $order->table()->update(['status' => 'available']);
                    }
                } elseif ($status === 'failed') {
                    Payment::where('order_id', $order->id)
                        ->where('status', 'pending')
                        ->update(['status' => 'failed']);
                }
            });

            return response()->json(['message' => 'OK']);
        } catch (\Throwable $e) {
            Log::error('Midtrans notification error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error'], 500);
        }
    }

    private function mapPaymentType(string $type): string
    {
        return match (true) {
            str_contains($type, 'qris')         => 'qris',
            str_contains($type, 'bank_transfer') => 'transfer',
            str_contains($type, 'credit_card')  => 'credit_card',
            default                             => 'qris',
        };
    }
}
