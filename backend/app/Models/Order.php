<?php

namespace App\Models;

use App\Models\Traits\BelongsToRestaurant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use BelongsToRestaurant;

    protected $fillable = [
        'restaurant_id',
        'order_number',
        'table_id',
        'customer_id',
        'cashier_id',
        'order_type',
        'status',
        'notes',
        'customer_name',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total',
        'payment_status',
        'public_token',
    ];

    protected $casts = [
        'subtotal'        => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount'      => 'decimal:2',
        'total'           => 'decimal:2',
    ];

    /* ─────────────── Relationships ─────────────── */

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /* ─────────────── Helpers ─────────────── */

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['pending', 'confirmed'])
            && $this->payment_status === 'unpaid';
    }

    /**
     * Allowed next statuses based on current status.
     */
    public function allowedNextStatuses(): array
    {
        return match ($this->status) {
            'pending'   => ['confirmed', 'cancelled'],
            'confirmed' => ['cooking', 'cancelled'],
            'cooking'   => ['ready'],
            'ready'     => ['completed'],
            default     => [],
        };
    }
}
