<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ──────────────────────────────────────────────
    // Register
    // ──────────────────────────────────────────────

    public function test_owner_can_register(): void
    {
        // Register requires 'basic' plan for trial subscription creation
        $this->createPlan('basic', ['price_monthly' => 49000, 'is_active' => true]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Budi Santoso',
            'email'                 => 'budi@example.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'restaurant_name'       => 'Warung Budi',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user']]);

        $this->assertDatabaseHas('users', ['email' => 'budi@example.com']);
        $this->assertDatabaseHas('restaurants', ['name' => 'Warung Budi']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        // Need a plan so register can proceed to the duplicate email check
        $this->createPlan('basic', ['price_monthly' => 49000, 'is_active' => true]);

        $restaurant = $this->createRestaurant();
        $this->createUser($restaurant, 'owner', ['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Someone Else',
            'email'                 => 'taken@example.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'restaurant_name'       => 'Warung Lain',
        ])->assertStatus(422);
    }
    // Login / Logout
    // ──────────────────────────────────────────────

    public function test_user_can_login(): void
    {
        $restaurant = $this->createRestaurant();
        $user       = $this->createUser($restaurant, 'owner', [
            'email'    => 'owner@example.com',
            'password' => Hash::make('Password1!'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'owner@example.com',
            'password' => 'Password1!',
        ])->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user']]);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $restaurant = $this->createRestaurant();
        $this->createUser($restaurant, 'owner', [
            'email'    => 'owner@example.com',
            'password' => Hash::make('Correct1!'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'owner@example.com',
            'password' => 'WrongPass!',
        ])->assertStatus(401);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $restaurant = $this->createRestaurant();
        $this->createUser($restaurant, 'owner', [
            'email'     => 'inactive@example.com',
            'password'  => Hash::make('Password1!'),
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'inactive@example.com',
            'password' => 'Password1!',
        ])->assertStatus(403);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $restaurant = $this->createRestaurant();
        $user       = $this->createUser($restaurant, 'owner');
        $this->actingAsUser($user);

        $this->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    // ──────────────────────────────────────────────
    // /me endpoint
    // ──────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        ['owner' => $owner] = $this->authenticatedOwner();

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $owner->email);
    }

    public function test_unauthenticated_request_gets_401(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    // ──────────────────────────────────────────────
    // Profile update
    // ──────────────────────────────────────────────

    public function test_owner_can_update_profile(): void
    {
        $this->authenticatedOwner();

        $this->putJson('/api/v1/auth/profile', [
            'name'  => 'Updated Name',
            'phone' => '081212345678',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Name');
    }

    // ──────────────────────────────────────────────
    // Change password
    // ──────────────────────────────────────────────

    public function test_owner_can_change_password(): void
    {
        $restaurant = $this->createRestaurant();
        $user       = $this->createUser($restaurant, 'owner', [
            'password' => Hash::make('OldPass1!'),
        ]);
        $this->actingAsUser($user);

        $this->putJson('/api/v1/auth/password', [
            'current_password'          => 'OldPass1!',
            'new_password'              => 'NewPass2!',
            'new_password_confirmation' => 'NewPass2!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPass2!', $user->fresh()->password));
    }
}
