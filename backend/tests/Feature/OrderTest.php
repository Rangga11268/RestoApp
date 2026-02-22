<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private function setupMenuAndTable(): array
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $category = MenuCategory::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Makanan',
            'sort_order'    => 1,
        ]);

        $item = MenuItem::create([
            'restaurant_id' => $restaurant->id,
            'category_id'   => $category->id,
            'name'          => 'Nasi Goreng',
            'price'         => 25000,
            'is_available'  => true,
            'sort_order'    => 1,
        ]);

        $table = RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Meja 1',
            'capacity'      => 4,
            'status'        => 'available',
            'qr_code'       => 'qr-' . uniqid(),
        ]);

        return compact('restaurant', 'item', 'table');
    }

    // ──────────────────────────────────────────────
    // Create Order
    // ──────────────────────────────────────────────

    public function test_cashier_can_create_order(): void
    {
        ['restaurant' => $restaurant, 'item' => $item, 'table' => $table] = $this->setupMenuAndTable();
        $cashier = $this->createUser($restaurant, 'cashier');
        $this->actingAsUser($cashier);

        $this->postJson('/api/v1/orders', [
            'table_id'   => $table->id,
            'order_type' => 'dine_in',
            'items'      => [
                ['menu_item_id' => $item->id, 'quantity' => 2, 'notes' => ''],
            ],
        ])->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('orders', ['restaurant_id' => $restaurant->id]);
    }

    public function test_order_requires_at_least_one_item(): void
    {
        ['table' => $table] = $this->setupMenuAndTable();

        $this->postJson('/api/v1/orders', [
            'table_id'   => $table->id,
            'order_type' => 'dine_in',
            'items'      => [],
        ])->assertStatus(422);
    }

    // ──────────────────────────────────────────────
    // List Orders
    // ──────────────────────────────────────────────

    public function test_owner_can_list_orders(): void
    {
        $this->authenticatedOwner();

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    // ──────────────────────────────────────────────
    // Update Order Status
    // ──────────────────────────────────────────────

    public function test_kitchen_can_update_order_status(): void
    {
        ['restaurant' => $restaurant, 'item' => $item, 'table' => $table] = $this->setupMenuAndTable();

        // Create an order first (as owner)
        $createResponse = $this->postJson('/api/v1/orders', [
            'table_id'   => $table->id,
            'order_type' => 'dine_in',
            'items'      => [
                ['menu_item_id' => $item->id, 'quantity' => 1, 'notes' => ''],
            ],
        ]);
        $createResponse->assertStatus(201);
        $orderId = $createResponse->json('data.id');

        // Manually set to 'confirmed' so kitchen can set to 'cooking'
        \App\Models\Order::withoutGlobalScopes()->find($orderId)->update(['status' => 'confirmed']);

        // Switch to kitchen user
        $kitchen = $this->createUser($restaurant, 'kitchen');
        $this->actingAsUser($kitchen);

        $this->patchJson("/api/v1/orders/{$orderId}/status", [
            'status' => 'cooking',
        ])->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $orderId, 'status' => 'cooking']);
    }

    // ──────────────────────────────────────────────
    // Tenant Isolation
    // ──────────────────────────────────────────────

    public function test_owner_cannot_see_other_restaurants_orders(): void
    {
        $this->authenticatedOwner();

        // Create order for restaurant B (manual insertion - bypass API)
        $restaurantB = $this->createRestaurant();
        $ownerB      = $this->createUser($restaurantB, 'owner');
        $tableB = RestaurantTable::create([
            'restaurant_id' => $restaurantB->id,
            'name'          => 'Meja B',
            'capacity'      => 2,
            'status'        => 'available',
            'qr_code'       => 'qr-b-' . uniqid(),
        ]);
        Order::create([
            'restaurant_id' => $restaurantB->id,
            'table_id'      => $tableB->id,
            'cashier_id'    => $ownerB->id,
            'order_number'  => 'ORD-B-001',
            'order_type'    => 'dine_in',
            'status'        => 'pending',
            'subtotal'      => 10000,
            'discount_amount' => 0,
            'tax_amount'    => 1000,
            'total'         => 11000,
            'payment_status' => 'unpaid',
        ]);

        // Restaurant A's owner retrieves orders — should only see 0 (their own)
        $response = $this->getJson('/api/v1/orders');
        $response->assertOk();
        $this->assertCount(0, $response->json('data'));
    }
}
