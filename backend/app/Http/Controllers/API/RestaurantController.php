<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\UpdateRestaurantRequest;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RestaurantController extends Controller
{
    use ApiResponse;

    /** GET /v1/restaurant */
    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->user()
            ->restaurant()
            ->with(['subscription.plan'])
            ->firstOrFail();

        return $this->success($restaurant);
    }

    /** PUT /v1/restaurant */
    public function update(UpdateRestaurantRequest $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        $data = $request->safe()->except('logo');

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($restaurant->logo_url) {
                $oldPath = str_replace('/storage/', '', $restaurant->logo_url);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('logo')->store('restaurant-logos', 'public');
            $data['logo_url'] = Storage::url($path);
        }

        $restaurant->update($data);

        return $this->success(
            $restaurant->fresh()->load('subscription.plan'),
            'Informasi restoran berhasil diperbarui.'
        );
    }
}
