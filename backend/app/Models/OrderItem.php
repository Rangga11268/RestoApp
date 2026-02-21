<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'menu_item_name',
        'quantity',
        'price_snapshot',
        'subtotal',
        'notes',
    ];

    protected $casts = [
        'quantity'       => 'integer',
        'price_snapshot' => 'decimal:2',
        'subtotal'       => 'decimal:2',
        'created_at'     => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
