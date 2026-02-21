<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\StoreCategoryRequest;
use App\Http\Requests\Menu\UpdateCategoryRequest;
use App\Http\Traits\ApiResponse;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    use ApiResponse;

    /** GET /v1/menu/categories */
    public function index(Request $request): JsonResponse
    {
        $categories = MenuCategory::withTrashed($request->boolean('with_trashed'))
            ->withCount('menuItems')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    /** POST /v1/menu/categories */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $user      = $request->user();
        $sortOrder = MenuCategory::max('sort_order') + 1;

        $category = MenuCategory::create([
            'name'        => $request->name,
            'description' => $request->description,
            'sort_order'  => $request->sort_order ?? $sortOrder,
            'is_active'   => $request->boolean('is_active', true),
        ]);

        return $this->created($category, 'Kategori berhasil ditambahkan.');
    }

    /** GET /v1/menu/categories/{id} */
    public function show(MenuCategory $menuCategory): JsonResponse
    {
        return $this->success($menuCategory->load('menuItems'));
    }

    /** PUT /v1/menu/categories/{id} */
    public function update(UpdateCategoryRequest $request, MenuCategory $menuCategory): JsonResponse
    {
        $menuCategory->update($request->validated());

        return $this->success($menuCategory->fresh(), 'Kategori berhasil diperbarui.');
    }

    /** DELETE /v1/menu/categories/{id} */
    public function destroy(MenuCategory $menuCategory): JsonResponse
    {
        // Check for active menu items in this category
        $activeItems = $menuCategory->menuItems()->count();
        if ($activeItems > 0) {
            return $this->error(
                "Tidak dapat menghapus kategori yang masih memiliki {$activeItems} item menu. Hapus atau pindahkan item terlebih dahulu.",
                409
            );
        }

        $menuCategory->delete();

        return $this->success(null, 'Kategori berhasil dihapus.');
    }

    /** PATCH /v1/menu/categories/reorder — bulk reorder */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'items'           => ['required', 'array'],
            'items.*.id'      => ['required', 'integer'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->items as $item) {
            MenuCategory::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return $this->success(null, 'Urutan kategori berhasil disimpan.');
    }
}
