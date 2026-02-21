<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Str;
use Midtrans\Config as MidtransConfig;
use Midtrans\Notification as MidtransNotification;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        MidtransConfig::$serverKey    = config('midtrans.server_key');
        MidtransConfig::$clientKey    = config('midtrans.client_key');
        MidtransConfig::$isProduction = config('midtrans.is_production');
        MidtransConfig::$isSanitized  = config('midtrans.is_sanitized');
        MidtransConfig::$is3ds        = config('midtrans.is_3ds');
    }

    /**
     * Create a Midtrans Snap token for the given order.
     *
     * @return array{snap_token: string, redirect_url: string, client_key: string, snap_url: string}
     */
    public function createSnapToken(Order $order): array
    {
        $order->loadMissing(['items', 'restaurant']);

        $itemDetails = $order->items->map(fn($item) => [
            'id'    => (string) $item->menu_item_id,
            'price' => (int) $item->price_snapshot,
            'quantity' => $item->quantity,
            'name'  => Str::limit($item->menu_item_name, 50),
        ])->toArray();

        // Tax from order
        if ((int) $order->tax_amount > 0) {
            $itemDetails[] = [
                'id'       => 'tax',
                'price'    => (int) $order->tax_amount,
                'quantity' => 1,
                'name'     => 'Pajak',
            ];
        }

        // Discount
        if ((int) $order->discount_amount > 0) {
            $itemDetails[] = [
                'id'       => 'discount',
                'price'    => -(int) $order->discount_amount,
                'quantity' => 1,
                'name'     => 'Diskon',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id'     => $order->order_number . '-' . time(),
                'gross_amount' => (int) $order->total,
            ],
            'item_details' => $itemDetails,
            'customer_details' => [
                'first_name' => $order->customer_name ?? 'Pelanggan',
                'email'      => $order->restaurant->email,
            ],
            'enabled_payments' => ['qris', 'bank_transfer', 'credit_card', 'gopay', 'shopeepay'],
            'callbacks' => [
                'finish' => config('app.frontend_url') . '/orders/' . $order->id,
            ],
        ];

        $snapToken = Snap::getSnapToken($params);

        return [
            'snap_token'   => $snapToken,
            'client_key'   => MidtransConfig::$clientKey,
            'snap_url'     => config('midtrans.snap_url'),
        ];
    }

    /**
     * Parse and verify an incoming Midtrans notification.
     *
     * @return MidtransNotification
     */
    public function parseNotification(): MidtransNotification
    {
        return new MidtransNotification();
    }

    /**
     * Map Midtrans transaction_status + fraud_status to our payment status.
     */
    public function resolveStatus(string $transactionStatus, string $fraudStatus = ''): string
    {
        return match ($transactionStatus) {
            'capture'   => $fraudStatus === 'challenge' ? 'pending' : 'paid',
            'settlement' => 'paid',
            'pending'   => 'pending',
            'deny', 'cancel', 'expire', 'failure' => 'failed',
            'refund', 'partial_refund' => 'refunded',
            default => 'pending',
        };
    }
}
