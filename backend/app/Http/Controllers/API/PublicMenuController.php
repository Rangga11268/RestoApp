<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/public/{slug}/menu
     * Public endpoint — no authentication required.
     * Returns the full active menu for a restaurant identified by slug.
     */
    public function menu(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $restaurant) {
            return $this->error('Restoran tidak ditemukan.', 404);
        }

        // Categories with active items only
        $categories = MenuCategory::where('restaurant_id', $restaurant->id)
            ->where('is_active', true)
            ->with([
                'activeMenuItems' => function ($q) {
                    $q->orderBy('sort_order')->orderBy('name');
                },
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->filter(fn($c) => $c->activeMenuItems->isNotEmpty())
            ->values();

        // Table info (if ?table=id provided)
        $tableInfo = null;
        if ($request->filled('table')) {
            $tableInfo = RestaurantTable::where('id', $request->table)
                ->where('restaurant_id', $restaurant->id)
                ->where('is_active', true)
                ->first(['id', 'name', 'capacity', 'status']);
        }

        return $this->success([
            'restaurant' => [
                'name'     => $restaurant->name,
                'slug'     => $restaurant->slug,
                'logo_url' => $restaurant->logo_url,
                'timezone' => $restaurant->timezone,
                'currency' => $restaurant->currency,
            ],
            'table'      => $tableInfo,
            'categories' => $categories,
        ]);
    }
}
