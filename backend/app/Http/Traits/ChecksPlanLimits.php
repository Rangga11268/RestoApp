<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Http\JsonResponse;

trait ChecksPlanLimits
{
    /**
     * Returns a JSON error response if the user's plan limit is exceeded.
     * Returns null if within limits.
     *
     * @param  User   $user
     * @param  string $limitKey   'max_menu_items' | 'max_tables' | 'max_staff'
     * @param  int    $currentCount
     * @return JsonResponse|null
     */
    protected function enforcePlanLimit(User $user, string $limitKey, int $currentCount): ?JsonResponse
    {
        $restaurant = $user->restaurant;
        if (! $restaurant) return null;

        $subscription = $restaurant->subscription()->with('plan')->first();
        if (! $subscription || ! $subscription->plan) return null;

        $maxAllowed = (int) $subscription->plan->{$limitKey};

        // 0 means unlimited
        if ($maxAllowed === 0) return null;

        if ($currentCount >= $maxAllowed) {
            $label = match ($limitKey) {
                'max_menu_items' => 'item menu',
                'max_tables'     => 'meja',
                'max_staff'      => 'staf',
                default          => 'item',
            };

            return $this->error(
                "Anda telah mencapai batas paket: maksimal {$maxAllowed} {$label}. Upgrade paket untuk menambah lebih banyak.",
                403,
                ['limit' => $maxAllowed, 'current' => $currentCount, 'plan' => $subscription->plan->name]
            );
        }

        return null;
    }
}
