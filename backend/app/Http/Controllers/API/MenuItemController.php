<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\StoreMenuItemRequest;
use App\Http\Requests\Menu\UpdateMenuItemRequest;
use App\Http\Traits\ApiResponse;
use App\Http\Traits\ChecksPlanLimits;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    use ApiResponse, ChecksPlanLimits;

    /** GET /v1/menu/items */
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::with('category')
            ->when($request->filled('category_id'), fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->filled('is_available'), fn($q) => $q->where('is_available', $request->boolean('is_available')))
            ->when($request->filled('search'), fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->boolean('paginate', false)) {
            return $this->paginated($query->paginate($request->integer('per_page', 20)));
        }

        return $this->success($query->get());
    }

    /** POST /v1/menu/items */
    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $user = $request->user();

        // Enforce plan limit
        $currentCount = MenuItem::count();
        if ($error = $this->enforcePlanLimit($user, 'max_menu_items', $currentCount)) {
            return $error;
        }

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $imageUrl = $request->file('image')->store('menu-items', 'public');
        }

        $sortOrder = MenuItem::max('sort_order') + 1;

        $item = MenuItem::create([
            'category_id'      => $request->category_id,
            'name'             => $request->name,
            'description'      => $request->description,
            'price'            => $request->price,
            'image_url'        => $imageUrl ? Storage::url($imageUrl) : null,
            'is_available'     => $request->boolean('is_available', true),
            'is_featured'      => $request->boolean('is_featured', false),
            'preparation_time' => $request->preparation_time ?? 0,
            'sort_order'       => $request->sort_order ?? $sortOrder,
        ]);

        return $this->created($item->load('category'), 'Menu berhasil ditambahkan.');
    }

    /** GET /v1/menu/items/{id} */
    public function show(MenuItem $menuItem): JsonResponse
    {
        return $this->success($menuItem->load('category'));
    }

    /** PUT /v1/menu/items/{id} */
    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // Delete old image
            if ($menuItem->image_url) {
                $oldPath = str_replace('/storage/', '', $menuItem->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('menu-items', 'public');
            $data['image_url'] = Storage::url($path);
        }

        $menuItem->update($data);

        return $this->success($menuItem->fresh()->load('category'), 'Menu berhasil diperbarui.');
    }

    /** PATCH /v1/menu/items/{id}/toggle */
    public function toggle(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update(['is_available' => ! $menuItem->is_available]);

        $status = $menuItem->is_available ? 'tersedia' : 'tidak tersedia';
        return $this->success(
            ['id' => $menuItem->id, 'is_available' => $menuItem->is_available],
            "Menu sekarang {$status}."
        );
    }

    /** DELETE /v1/menu/items/{id} */
    public function destroy(MenuItem $menuItem): JsonResponse
    {
        if ($menuItem->image_url) {
            $path = str_replace('/storage/', '', $menuItem->image_url);
            Storage::disk('public')->delete($path);
        }

        $menuItem->delete();

        return $this->success(null, 'Menu berhasil dihapus.');
    }
}
