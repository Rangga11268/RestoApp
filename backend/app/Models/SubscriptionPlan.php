<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'price_monthly',
        'max_staff',
        'max_menu_items',
        'max_tables',
        'features',
        'is_active',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'features'      => 'array',
        'is_active'     => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    /**
     * Check if a given limit is unlimited (0 = unlimited).
     */
    public function isUnlimited(string $field): bool
    {
        return $this->$field === 0;
    }
}
