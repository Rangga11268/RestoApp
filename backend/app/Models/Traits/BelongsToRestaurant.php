<?php

namespace App\Models\Traits;

use App\Models\Scopes\RestaurantScope;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

trait BelongsToRestaurant
{
    /**
     * Boot the trait and add the global scope.
     */
    protected static function bootBelongsToRestaurant(): void
    {
        static::addGlobalScope(new RestaurantScope());

        // Automatically set restaurant_id on create
        static::creating(function ($model) {
            /** @var User|null $user */
            $user = Auth::user();
            if (
                $user
                && $user->role !== 'superadmin'
                && empty($model->restaurant_id)
            ) {
                $model->restaurant_id = $user->restaurant_id;
            }
        });
    }
}
