<?php

namespace Tests;

use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    /**
     * Create a SubscriptionPlan (or get existing one).
     */
    protected function createPlan(string $name = 'Pro', array $overrides = []): SubscriptionPlan
    {
        return SubscriptionPlan::firstOrCreate(
            ['name' => $name],
            array_merge([
                'price_monthly'  => 99000,
                'max_staff'      => 10,
                'max_menu_items' => 100,
                'max_tables'     => 20,
                'is_active'      => true,
                'features'       => [],
            ], $overrides)
        );
    }

    /**
     * Create a Restaurant with an active subscription.
     */
    protected function createRestaurant(array $overrides = []): Restaurant
    {
        $plan = $this->createPlan();
        $slug = $overrides['slug'] ?? 'resto-' . uniqid();

        $restaurant = Restaurant::create(array_merge([
            'name'      => 'Test Restaurant',
            'slug'      => $slug,
            'email'     => $slug . '@test.com',
            'timezone'  => 'Asia/Jakarta',
            'currency'  => 'IDR',
            'is_active' => true,
        ], $overrides));

        Subscription::create([
            'restaurant_id' => $restaurant->id,
            'plan_id'       => $plan->id,
            'status'        => 'active',
            'starts_at'     => now()->subDay()->toDateString(),
            'ends_at'       => now()->addMonth()->toDateString(),
        ]);

        return $restaurant;
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
