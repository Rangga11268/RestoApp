<?php

namespace App\Models\Scopes;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class RestaurantScope implements Scope
{
    /**
     * @param  Builder<Model>  $builder
     * @param  Model  $model
     */
    public function apply(Builder $builder, Model $model): void
    {
        /** @var User|null $user */
        $user = Auth::user();
        if ($user && $user->role !== 'superadmin') {
            $builder->where($model->getTable() . '.restaurant_id', $user->restaurant_id);
        }
    }
}
