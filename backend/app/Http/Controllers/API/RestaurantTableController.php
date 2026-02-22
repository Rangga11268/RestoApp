<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\StoreTableRequest;
use App\Http\Requests\Menu\UpdateTableRequest;
use App\Http\Traits\ApiResponse;
use App\Http\Traits\ChecksPlanLimits;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantTableController extends Controller
{
    use ApiResponse, ChecksPlanLimits;

    /** GET /v1/tables */
    public function index(): JsonResponse
    {
        $tables = RestaurantTable::orderBy('name')->get();

        return $this->success($tables);
    }

    /** POST /v1/tables */
    public function store(StoreTableRequest $request): JsonResponse
    {
        $user = $request->user();

        // Enforce plan limit
        $currentCount = RestaurantTable::count();
        if ($error = $this->enforcePlanLimit($user, 'max_tables', $currentCount)) {
            return $error;
        }

        $restaurant = $user->restaurant;

        $table = RestaurantTable::create([
            'name'      => $request->name,
            'capacity'  => $request->capacity,
            'is_active' => $request->boolean('is_active', true),
            'status'    => 'available',
        ]);

        // Simpan path saja — frontend generate QR image pakai window.location.origin + path.
        // Sehingga QR selalu valid di lokal (IP berubah-ubah) maupun production (custom domain).
        $table->update(['qr_code' => "/menu/{$restaurant->slug}?table={$table->id}"]);

        return $this->created($table, 'Meja berhasil ditambahkan.');
    }

    /** GET /v1/tables/{id} */
    public function show(RestaurantTable $restaurantTable): JsonResponse
    {
        return $this->success($restaurantTable);
    }

    /** PUT /v1/tables/{id} */
    public function update(UpdateTableRequest $request, RestaurantTable $restaurantTable): JsonResponse
    {
        $restaurantTable->update($request->validated());

        return $this->success($restaurantTable->fresh(), 'Meja berhasil diperbarui.');
    }

    /** DELETE /v1/tables/{id} */
    public function destroy(RestaurantTable $restaurantTable): JsonResponse
    {
        $activeOrders = $restaurantTable->orders()->whereNotIn('status', ['completed', 'cancelled'])->count();
        if ($activeOrders > 0) {
            return $this->error('Tidak dapat menghapus meja yang memiliki pesanan aktif.', 409);
        }

        $restaurantTable->delete();

        return $this->success(null, 'Meja berhasil dihapus.');
    }

    /** POST /v1/tables/{id}/regenerate-qr */
    public function regenerateQr(Request $request, RestaurantTable $restaurantTable): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        // Re-set path (berguna jika slug berubah atau data lama masih format base64 SVG)
        $restaurantTable->update([
            'qr_code' => "/menu/{$restaurant->slug}?table={$restaurantTable->id}",
        ]);

        return $this->success(
            ['qr_code' => $restaurantTable->qr_code],
            'QR code berhasil di-generate ulang.'
        );
    }
}
