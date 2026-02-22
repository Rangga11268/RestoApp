<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\ActivityLog;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    use ApiResponse;

    /* ────────────────────────────────────────────────────
     | GET /v1/subscription/plans
     | List all active plans (public — any auth user)
     ──────────────────────────────────────────────────── */
    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::where('is_active', true)
            ->orderBy('price_monthly')
            ->get()
            ->map(fn($plan) => [
                'id'             => $plan->id,
                'name'           => $plan->name,
                'price_monthly'  => (float) $plan->price_monthly,
                'max_staff'      => $plan->max_staff,
                'max_menu_items' => $plan->max_menu_items,
                'max_tables'     => $plan->max_tables,
                'features'       => $plan->features ?? [],
            ]);

        return $this->success($plans);
    }

    /* ────────────────────────────────────────────────────
     | GET /v1/subscription/current
     | Current restaurant subscription detail
     ──────────────────────────────────────────────────── */
    public function current(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        if (! $restaurant) {
            return $this->error('Restoran tidak ditemukan.', 404);
        }

        $sub = $restaurant->subscription()->with('plan')->first();

        if (! $sub) {
            return $this->success(null);
        }

        return $this->success($this->formatSubscription($sub));
    }

    /* ────────────────────────────────────────────────────
     | POST /v1/subscription/subscribe
     | Subscribe to a plan (or upgrade / renew)
     | Body: { plan_id, months? }
     ──────────────────────────────────────────────────── */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'months'  => 'nullable|integer|min:1|max:12',
        ]);

        $user   = $request->user();
        $plan   = SubscriptionPlan::findOrFail($request->plan_id);
        $months = (int) $request->input('months', 1);

        if (! $plan->is_active) {
            return $this->error('Paket berlangganan tidak tersedia.', 422);
        }

        $restaurant  = $user->restaurant;
        $existing    = $restaurant->subscription;
        $startsAt    = now();

        // If currently active, extend from current ends_at
        if ($existing && $existing->isActive() && $existing->ends_at && $existing->ends_at->isFuture()) {
            $startsAt = $existing->ends_at;
        }

        $endsAt = Carbon::parse($startsAt)->addMonths($months);

        if ($existing) {
            $existing->update([
                'plan_id'   => $plan->id,
                'status'    => 'active',
                'starts_at' => $startsAt->toDateString(),
                'ends_at'   => $endsAt->toDateString(),
            ]);
            $sub = $existing->fresh('plan');
        } else {
            $sub = Subscription::create([
                'restaurant_id' => $restaurant->id,
                'plan_id'       => $plan->id,
                'status'        => 'active',
                'starts_at'     => $startsAt->toDateString(),
                'ends_at'       => $endsAt->toDateString(),
            ]);
            $sub->load('plan');
        }

        ActivityLog::log('subscription.subscribe', $sub, [
            'plan'   => $plan->name,
            'months' => $months,
        ]);

        return $this->success($this->formatSubscription($sub), 'Langganan berhasil diaktifkan.');
    }

    /* ────────────────────────────────────────────────────
     | POST /v1/subscription/cancel
     | Mark subscription as cancelled
     ──────────────────────────────────────────────────── */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $sub  = $user->restaurant?->subscription;

        if (! $sub) {
            return $this->error('Tidak ada langganan aktif.', 404);
        }

        $sub->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        ActivityLog::log('subscription.cancelled', $sub);

        return $this->success($this->formatSubscription($sub->fresh('plan')), 'Langganan dibatalkan.');
    }

    /* ─────────────── Private ─────────────── */

    private function formatSubscription(Subscription $sub): array
    {
        return [
            'id'             => $sub->id,
            'status'         => $sub->status,
            'starts_at'      => $sub->starts_at?->toDateString(),
            'ends_at'        => $sub->ends_at?->toDateString(),
            'trial_ends_at'  => $sub->trial_ends_at?->toDateString(),
            'cancelled_at'   => $sub->cancelled_at?->toDateTimeString(),
            'days_remaining' => $sub->daysRemaining(),
            'is_active'      => $sub->isActive(),
            'is_expiring'    => $sub->isExpiringsSoon(7),
            'plan' => $sub->plan ? [
                'id'             => $sub->plan->id,
                'name'           => $sub->plan->name,
                'price_monthly'  => (float) $sub->plan->price_monthly,
                'max_staff'      => $sub->plan->max_staff,
                'max_menu_items' => $sub->plan->max_menu_items,
                'max_tables'     => $sub->plan->max_tables,
                'features'       => $sub->plan->features ?? [],
            ] : null,
        ];
    }
}
