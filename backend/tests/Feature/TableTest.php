<?php

namespace Tests\Feature;

use App\Models\RestaurantTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TableTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_list_tables(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Meja 1',
            'capacity'      => 4,
            'status'        => 'available',
            'qr_code'       => 'qr-1',
        ]);

        $this->getJson('/api/v1/tables')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_create_table(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/tables', [
            'name'     => 'Meja VIP',
            'capacity' => 8,
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'Meja VIP');
    }

    public function test_table_name_is_required(): void
    {
        $this->authenticatedOwner();

        $this->postJson('/api/v1/tables', ['capacity' => 4])
            ->assertStatus(422);
    }

    public function test_owner_can_update_table(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $table = RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Lama',
            'capacity'      => 4,
            'status'        => 'available',
            'qr_code'       => 'qr-lama',
        ]);

        $this->putJson("/api/v1/tables/{$table->id}", ['name' => 'Baru'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Baru');
    }

    public function test_owner_can_delete_table(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $table = RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'Hapus',
            'capacity'      => 2,
            'status'        => 'available',
            'qr_code'       => 'qr-hapus',
        ]);

        $this->deleteJson("/api/v1/tables/{$table->id}")->assertOk();
        $this->assertDatabaseMissing('restaurant_tables', ['id' => $table->id]);
    }

    public function test_owner_can_regenerate_qr_code(): void
    {
        ['restaurant' => $restaurant] = $this->authenticatedOwner();

        $table = RestaurantTable::create([
            'restaurant_id' => $restaurant->id,
            'name'          => 'QR Test',
            'capacity'      => 2,
            'status'        => 'available',
            'qr_code'       => 'qr-old',
        ]);

        $this->postJson("/api/v1/tables/{$table->id}/regenerate-qr")
            ->assertOk();

        $this->assertNotEquals('qr-old', $table->fresh()->qr_code);
    }

    public function test_tenant_isolation_for_tables(): void
    {
        $this->authenticatedOwner();

        $otherRestaurant = $this->createRestaurant();
        $otherTable = RestaurantTable::create([
            'restaurant_id' => $otherRestaurant->id,
            'name'          => 'Tabel Lain',
            'capacity'      => 4,
            'status'        => 'available',
            'qr_code'       => 'qr-other',
        ]);

        $this->deleteJson("/api/v1/tables/{$otherTable->id}")->assertStatus(404);
    }
}
