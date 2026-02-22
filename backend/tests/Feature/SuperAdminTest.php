<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Create and authenticate as a superadmin (no restaurant needed).
     */
    private function asSuperAdmin(): User
    {
        $admin = User::create([
            'name'          => 'Super Admin',
            'email'         => 'admin@restoapp.com',
            'password'      => bcrypt('Admin1234!'),
            'role'          => 'superadmin',
            'is_active'     => true,
            'restaurant_id' => null,
        ]);
        $this->actingAsUser($admin);
        return $admin;
    }

    // ──────────────────────────────────────────────
    // Access Control
    // ──────────────────────────────────────────────

    public function test_regular_owner_cannot_access_superadmin_endpoints(): void
    {
        $this->authenticatedOwner();

        $this->getJson('/api/v1/superadmin/stats')->assertStatus(403);
        $this->getJson('/api/v1/superadmin/restaurants')->assertStatus(403);
        $this->getJson('/api/v1/superadmin/logs')->assertStatus(403);
    }

    public function test_unauthenticated_request_cannot_access_superadmin(): void
    {
        $this->getJson('/api/v1/superadmin/stats')->assertStatus(401);
    }

    // ──────────────────────────────────────────────
    // Stats
    // ──────────────────────────────────────────────

    public function test_superadmin_can_get_platform_stats(): void
    {
        $this->asSuperAdmin();

        $this->getJson('/api/v1/superadmin/stats')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [
                'restaurants',
                'users',
                'subscriptions',
                'revenue',
                'growth',
            ]]);
    }

    // ──────────────────────────────────────────────
    // Restaurants List
    // ──────────────────────────────────────────────

    public function test_superadmin_can_list_restaurants(): void
    {
        $this->asSuperAdmin();

        // Seed some restaurants
        $this->createRestaurant();
        $this->createRestaurant();

        $this->getJson('/api/v1/superadmin/restaurants')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta' => ['total', 'current_page']]]);
    }

    public function test_superadmin_can_search_restaurants(): void
    {
        $this->asSuperAdmin();
        $this->createRestaurant(['name' => 'Warung Budi', 'slug' => 'warung-budi']);
        $this->createRestaurant(['name' => 'Restoran Sari', 'slug' => 'restoran-sari']);

        $response = $this->getJson('/api/v1/superadmin/restaurants?search=Sari');
        $response->assertOk();
        $this->assertCount(1, $response->json('data.data'));
    }

    // ──────────────────────────────────────────────
    // Show Single Restaurant
    // ──────────────────────────────────────────────

    public function test_superadmin_can_view_restaurant_detail(): void
    {
        $this->asSuperAdmin();
        $restaurant = $this->createRestaurant();

        $this->getJson("/api/v1/superadmin/restaurants/{$restaurant->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $restaurant->id);
    }

    // ──────────────────────────────────────────────
    // Toggle Restaurant
    // ──────────────────────────────────────────────

    public function test_superadmin_can_suspend_restaurant(): void
    {
        $this->asSuperAdmin();
        $restaurant = $this->createRestaurant();

        $this->assertTrue($restaurant->is_active);

        $this->patchJson("/api/v1/superadmin/restaurants/{$restaurant->id}/toggle")
            ->assertOk();

        $this->assertFalse($restaurant->fresh()->is_active);
    }

    public function test_superadmin_can_reactivate_suspended_restaurant(): void
    {
        $this->asSuperAdmin();
        $restaurant = $this->createRestaurant(['is_active' => false]);

        $this->patchJson("/api/v1/superadmin/restaurants/{$restaurant->id}/toggle")
            ->assertOk();

        $this->assertTrue($restaurant->fresh()->is_active);
    }

    // ──────────────────────────────────────────────
    // Activity Logs
    // ──────────────────────────────────────────────

    public function test_superadmin_can_view_activity_logs(): void
    {
        $this->asSuperAdmin();

        $this->getJson('/api/v1/superadmin/logs')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta' => ['total', 'current_page']]]);
    }
}
