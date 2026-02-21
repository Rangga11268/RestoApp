<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'restaurant_id',
        'plan_id',
        'status',
        'trial_ends_at',
        'starts_at',
        'ends_at',
        'cancelled_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'starts_at'     => 'date',
        'ends_at'       => 'date',
        'cancelled_at'  => 'datetime',
    ];

    /* ─────────────── Relationships ─────────────── */

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    /* ─────────────── Helpers ─────────────── */

    public function isActive(): bool
    {
        return in_array($this->status, ['active', 'trialing']);
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->ends_at && $this->ends_at->isPast());
    }

    public function daysRemaining(): int
    {
        if (! $this->ends_at) {
            return 0;
        }
        return max(0, (int) now()->diffInDays($this->ends_at, false));
    }

    public function isExpiringsSoon(int $days = 7): bool
    {
        return $this->isActive() && $this->daysRemaining() <= $days;
    }
}
