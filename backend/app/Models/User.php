<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar_url',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    /* ─────────────── Role Helpers ─────────────── */

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }
    public function isCashier(): bool
    {
        return $this->role === 'cashier';
    }
    public function isKitchen(): bool
    {
        return $this->role === 'kitchen';
    }
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function hasRole(string|array $roles): bool
    {
        return in_array($this->role, (array) $roles);
    }

    public function canManageRestaurant(): bool
    {
        return in_array($this->role, ['owner', 'manager']);
    }

    /* ─────────────── Relationships ─────────────── */

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function processedOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'cashier_id');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
