<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Plans
    // ──────────────────────────────────────────────

    public function test_authenticated_user_can_list_plans(): void
    {
        $this->createPlan('Basic', ['price_monthly' => 49000]);
        $this->createPlan('Pro',   ['price_monthly' => 99000]);

        ['owner' => $owner] = $this->authenticatedOwner();

        $this->getJson('/api/v1/subscription/plans')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data');
    }

    public function test_inactive_plans_are_excluded(): void
    {
        // authenticatedOwner() creates a 'Pro' plan via createRestaurant()
        // We'll add one inactive plan only
        $this->authenticatedOwner(); // creates Pro plan

        SubscriptionPlan::firstOrCreate(
            ['name' => 'Legacy'],
            [
                'price_monthly'  => 29000,
                'max_staff'      => 2,
                'max_menu_items' => 10,
                'max_tables'     => 5,
                'is_active'      => false,
                'features'       => [],
            ]
        );

        $response = $this->getJson('/api/v1/subscription/plans');
        $response->assertOk();

        // Only 'Pro' is active; 'Legacy' is inactive
        $this->assertCount(1, $response->json('data'));
    }

    // ──────────────────────────────────────────────
    // Current subscription
    // ──────────────────────────────────────────────

    public function test_owner_can_view_current_subscription(): void
    {
        $this->authenticatedOwner();

        $this->getJson('/api/v1/subscription/current')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['status', 'ends_at', 'plan']]);
    }

    // ──────────────────────────────────────────────
    // Subscribe / Renew
    // ──────────────────────────────────────────────

    public function test_owner_can_subscribe_to_plan(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $plan = SubscriptionPlan::firstOrCreate(
            ['name' => 'Enterprise'],
            [
                'price_monthly'  => 199000,
                'max_staff'      => 50,
                'max_menu_items' => 500,
                'max_tables'     => 100,
                'is_active'      => true,
                'features'       => [],
            ]
        );

        $this->postJson('/api/v1/subscription/subscribe', [
            'plan_id' => $plan->id,
            'months'  => 3,
        ])->assertOk()
            ->assertJsonPath('success', true);

        // Subscription should be updated
        $sub = $restaurant->subscription()->first();
        $this->assertEquals('active', $sub->status);
        $this->assertEquals($plan->id, $sub->plan_id);
    }

    public function test_subscribe_fails_with_invalid_months(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $plan = $this->createPlan();

        $this->postJson('/api/v1/subscription/subscribe', [
            'plan_id' => $plan->id,
            'months'  => 13, // exceeds max 12
        ])->assertStatus(422);
    }

    public function test_subscribe_fails_with_nonexistent_plan(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/subscription/subscribe', [
            'plan_id' => 9999,
            'months'  => 1,
        ])->assertStatus(422);
    }

    // ──────────────────────────────────────────────
    // Cancel
    // ──────────────────────────────────────────────

    public function test_owner_can_cancel_subscription(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $this->postJson('/api/v1/subscription/cancel')
            ->assertOk();

        $this->assertEquals('cancelled', $restaurant->subscription()->first()->status);
    }

    // ──────────────────────────────────────────────
    // Expired subscription blocks mutating requests
    // ──────────────────────────────────────────────

    public function test_expired_subscription_blocks_menu_write(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        // Manually expire the subscription
        $restaurant->subscription()->update([
            'status'  => 'expired',
            'ends_at' => now()->subDay()->toDateString(),
        ]);

        $this->postJson('/api/v1/menu/categories', ['name' => 'Test'])
            ->assertStatus(403);
    }

    public function test_expired_subscription_allows_GET_requests(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $restaurant->subscription()->update([
            'status'  => 'expired',
            'ends_at' => now()->subDay()->toDateString(),
        ]);

        $this->getJson('/api/v1/menu/categories')->assertOk();
    }
}
