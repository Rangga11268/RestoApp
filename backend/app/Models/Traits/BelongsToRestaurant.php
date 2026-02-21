<?php

namespace App\Models\Traits;

use App\Models\Scopes\RestaurantScope;

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
            if (
                auth()->check()
                && auth()->user()->role !== 'superadmin'
                && empty($model->restaurant_id)
            ) {
                $model->restaurant_id = auth()->user()->restaurant_id;
            }
        });
    }
}
