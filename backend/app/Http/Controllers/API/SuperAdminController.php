<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminController extends Controller
{
    use ApiResponse;

    /* ────────────────────────────────────────────────────
     | GET /v1/superadmin/stats
     | Platform-wide statistics
     ──────────────────────────────────────────────────── */
    public function stats(): JsonResponse
    {
        $totalRestaurants = Restaurant::count();
        $activeRestaurants = Restaurant::where('is_active', true)->count();
        $totalUsers = User::where('role', '!=', 'superadmin')->count();

        $subStats = Subscription::selectRaw(
            'COUNT(*) as total,
             SUM(CASE WHEN status IN ("active","trialing") THEN 1 ELSE 0 END) as active_count,
             SUM(CASE WHEN status = "trialing" THEN 1 ELSE 0 END) as trialing_count,
             SUM(CASE WHEN status IN ("expired","cancelled") THEN 1 ELSE 0 END) as inactive_count'
        )->first();

        $monthlyRevenue = Payment::where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $totalRevenue = Payment::where('status', 'paid')->sum('amount');

        // Restaurant growth — last 6 months
        $growth = Restaurant::selectRaw(
            "DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as count"
        )
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'count' => (int) $r->count]);

        return $this->success([
            'restaurants' => [
                'total'    => $totalRestaurants,
                'active'   => $activeRestaurants,
                'inactive' => $totalRestaurants - $activeRestaurants,
            ],
            'users' => $totalUsers,
            'subscriptions' => [
                'total'    => (int) $subStats->total,
                'active'   => (int) $subStats->active_count,
                'trialing' => (int) $subStats->trialing_count,
                'inactive' => (int) $subStats->inactive_count,
            ],
            'revenue' => [
                'this_month' => (float) $monthlyRevenue,
                'total'      => (float) $totalRevenue,
            ],
            'growth' => $growth,
        ]);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/superadmin/restaurants
     | All restaurants with subscription + filter
     ──────────────────────────────────────────────────── */
    public function restaurants(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $status = $request->input('status'); // active | inactive | all (default all)
        $subStatus = $request->input('subscription'); // active | trialing | expired | cancelled

        $query = Restaurant::with(['subscription.plan', 'users' => fn($q) => $q->where('role', 'owner')])
            ->withCount('users');

        if ($search) {
            $query->where(
                fn($q) => $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
            );
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($subStatus) {
            $query->whereHas('subscription', fn($q) => $q->where('status', $subStatus));
        }

        $restaurants = $query->orderByDesc('created_at')->paginate(20);

        $data = $restaurants->getCollection()->map(fn($r) => $this->formatRestaurant($r));

        return $this->success([
            'data' => $data,
            'meta' => [
                'current_page'  => $restaurants->currentPage(),
                'per_page'      => $restaurants->perPage(),
                'total'         => $restaurants->total(),
                'last_page'     => $restaurants->lastPage(),
            ],
        ]);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/superadmin/restaurants/{id}
     | Single restaurant detail
     ──────────────────────────────────────────────────── */
    public function showRestaurant(int $id): JsonResponse
    {
        $restaurant = Restaurant::with(['subscription.plan'])
            ->withCount(['users', 'menuItems', 'tables', 'orders'])
            ->findOrFail($id);

        return $this->success($this->formatRestaurant($restaurant, true));
    }

    /* ────────────────────────────────────────────────────
     | PATCH /v1/superadmin/restaurants/{id}/toggle
     | Suspend or reactivate a restaurant
     ──────────────────────────────────────────────────── */
    public function toggleRestaurant(Request $request, int $id): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update(['is_active' => ! $restaurant->is_active]);

        ActivityLog::log(
            $restaurant->is_active ? 'restaurant.activated' : 'restaurant.suspended',
            $restaurant,
            [],
            null // superadmin log — no restaurant_id scope
        );

        $status = $restaurant->is_active ? 'diaktifkan' : 'disuspend';
        return $this->success(
            ['id' => $restaurant->id, 'is_active' => $restaurant->is_active],
            "Restoran berhasil {$status}."
        );
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/superadmin/logs
     | Activity logs — paginated, filterable
     ──────────────────────────────────────────────────── */
    public function logs(Request $request): JsonResponse
    {
        $search        = $request->input('search');
        $restaurantId  = $request->input('restaurant_id');

        $query = ActivityLog::with(['user:id,name,email,role'])
            ->orderByDesc('created_at');

        if ($search) {
            $query->where('action', 'like', "%{$search}%");
        }

        if ($restaurantId) {
            $query->where('restaurant_id', $restaurantId);
        }

        $logs = $query->paginate(50);

        $data = $logs->getCollection()->map(fn($log) => [
            'id'            => $log->id,
            'action'        => $log->action,
            'subject_type'  => class_basename($log->subject_type ?? ''),
            'subject_id'    => $log->subject_id,
            'properties'    => $log->properties,
            'ip_address'    => $log->ip_address,
            'created_at'    => $log->created_at?->toDateTimeString(),
            'user'          => $log->user ? [
                'id'    => $log->user->id,
                'name'  => $log->user->name,
                'email' => $log->user->email,
                'role'  => $log->user->role,
            ] : null,
            'restaurant_id' => $log->restaurant_id,
        ]);

        return $this->success([
            'data' => $data,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
                'last_page'    => $logs->lastPage(),
            ],
        ]);
    }

    /* ─────────────── Private helpers ─────────────── */

    private function formatRestaurant(Restaurant $r, bool $detailed = false): array
    {
        $sub = $r->relationLoaded('subscription') ? $r->subscription : null;
        $owner = $r->relationLoaded('users')
            ? $r->users->where('role', 'owner')->first()
            : null;

        $data = [
            'id'         => $r->id,
            'name'       => $r->name,
            'slug'       => $r->slug,
            'email'      => $r->email,
            'phone'      => $r->phone,
            'is_active'  => $r->is_active,
            'created_at' => $r->created_at?->toDateString(),
            'owner' => $owner ? [
                'id'    => $owner->id,
                'name'  => $owner->name,
                'email' => $owner->email,
            ] : null,
            'subscription' => $sub ? [
                'status'         => $sub->status,
                'ends_at'        => $sub->ends_at?->toDateString(),
                'days_remaining' => $sub->daysRemaining(),
                'plan'           => $sub->plan?->name,
            ] : null,
        ];

        if ($detailed) {
            $data['users_count']      = $r->users_count ?? 0;
            $data['menu_items_count'] = $r->menu_items_count ?? 0;
            $data['tables_count']     = $r->tables_count ?? 0;
            $data['orders_count']     = $r->orders_count ?? 0;
            $data['address']          = $r->address;
            $data['logo_url']         = $r->logo_url;
            $data['timezone']         = $r->timezone;
            $data['currency']         = $r->currency;
        }

        return $data;
    }
}
