<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'cashier_id',
        'method',
        'amount',
        'change_amount',
        'status',
        'transaction_ref',
        'notes',
        'paid_at',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'change_amount' => 'decimal:2',
        'paid_at'       => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
