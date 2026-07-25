<?php

namespace Tests;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a Restaurant.
     */
    protected function createRestaurant(array $overrides = []): Restaurant
    {
        $slug = $overrides['slug'] ?? 'resto-' . uniqid();

        return Restaurant::create(array_merge([
            'name'      => 'Test Restaurant',
            'slug'      => $slug,
            'email'     => $slug . '@test.com',
            'timezone'  => 'Asia/Jakarta',
            'currency'  => 'IDR',
            'is_active' => true,
        ], $overrides));
    }

    /**
     * Create a user for a restaurant (default role: owner).
     */
    protected function createUser(Restaurant $restaurant, string $role = 'owner', array $overrides = []): User
    {
        return User::create(array_merge([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Test User',
            'email'         => $role . '-' . $restaurant->id . '-' . uniqid() . '@test.com',
            'password'      => Hash::make('Password1!'),
            'role'          => $role,
            'phone'         => null,
            'avatar_url'    => null,
            'is_active'     => true,
        ], $overrides))->fresh();
    }

    /**
     * Authenticate a user via Sanctum and return the user.
     */
    protected function actingAsUser(User $user): User
    {
        Sanctum::actingAs($user);
        return $user;
    }

    /**
     * Create a restaurant + owner and authenticate as that owner.
     */
    protected function authenticatedOwner(): array
    {
        $restaurant = $this->createRestaurant();
        $owner      = $this->createUser($restaurant, 'owner');
        $this->actingAsUser($owner);

        return compact('restaurant', 'owner');
    }
}
