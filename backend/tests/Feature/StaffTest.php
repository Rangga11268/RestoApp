<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // List Staff
    // ──────────────────────────────────────────────

    public function test_owner_can_list_staff(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $this->createUser($restaurant, 'cashier');
        $this->createUser($restaurant, 'kitchen');

        $this->getJson('/api/v1/staff')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_manager_cannot_list_staff(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $manager = $this->createUser($restaurant, 'manager');
        $this->actingAsUser($manager);

        $this->getJson('/api/v1/staff')->assertStatus(403);
    }

    // ──────────────────────────────────────────────
    // Create Staff
    // ──────────────────────────────────────────────

    public function test_owner_can_create_staff(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/staff', [
            'name'                  => 'Kasir Baru',
            'email'                 => 'kasir@test.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'cashier',
        ])->assertStatus(201)
            ->assertJsonPath('data.role', 'cashier');

        $this->assertDatabaseHas('users', ['email' => 'kasir@test.com']);
    }

    public function test_owner_cannot_create_staff_with_owner_role(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/staff', [
            'name'                  => 'Fake Owner',
            'email'                 => 'fake@test.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'owner', // invalid for staff
        ])->assertStatus(422);
    }

    public function test_owner_cannot_create_staff_with_superadmin_role(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/staff', [
            'name'                  => 'Fake SA',
            'email'                 => 'fakesa@test.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'superadmin',
        ])->assertStatus(422);
    }

    public function test_create_staff_fails_with_duplicate_email(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $this->createUser($restaurant, 'cashier', ['email' => 'existing@test.com']);

        $this->postJson('/api/v1/staff', [
            'name'                  => 'Another',
            'email'                 => 'existing@test.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'cashier',
        ])->assertStatus(422);
    }

    // ──────────────────────────────────────────────
    // Update Staff
    // ──────────────────────────────────────────────

    public function test_owner_can_update_staff(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $staff = $this->createUser($restaurant, 'cashier');

        $this->putJson("/api/v1/staff/{$staff->id}", [
            'name' => 'Updated Name',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    // ──────────────────────────────────────────────
    // Toggle Staff
    // ──────────────────────────────────────────────

    public function test_owner_can_toggle_staff_status(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $staff = $this->createUser($restaurant, 'cashier', ['is_active' => true]);

        $this->patchJson("/api/v1/staff/{$staff->id}/toggle")
            ->assertOk();

        $this->assertFalse($staff->fresh()->is_active);
    }

    // ──────────────────────────────────────────────
    // Delete Staff
    // ──────────────────────────────────────────────

    public function test_owner_can_soft_delete_staff(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();
        $staff = $this->createUser($restaurant, 'kitchen');

        $this->deleteJson("/api/v1/staff/{$staff->id}")
            ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $staff->id]);
    }

    // ──────────────────────────────────────────────
    // Tenant isolation — staff from other restaurant
    // ──────────────────────────────────────────────

    public function test_owner_cannot_manage_staff_from_other_restaurant(): void
    {
        $this->authenticatedOwner();

        $otherRestaurant = $this->createRestaurant();
        $otherStaff      = $this->createUser($otherRestaurant, 'cashier');

        $this->putJson("/api/v1/staff/{$otherStaff->id}", ['name' => 'Hacked'])
            ->assertStatus(404);

        $this->deleteJson("/api/v1/staff/{$otherStaff->id}")
            ->assertStatus(404);
    }
}
