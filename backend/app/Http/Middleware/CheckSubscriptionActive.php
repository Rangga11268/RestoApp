<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionActive
{
    /**
     * Block mutating requests (POST, PUT, PATCH, DELETE) if subscription is inactive.
     * GET requests are always allowed (read-only).
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role === 'superadmin') {
            return $next($request);
        }

        $subscription = $user->restaurant?->subscription;

        if (! $subscription || ! $subscription->isActive()) {
            // Allow read-only requests even with expired subscription
            if ($request->isMethod('GET')) {
                return $next($request);
            }

            return response()->json([
                'success' => false,
                'message' => 'Langganan Anda tidak aktif. Silakan perbarui subscription untuk melanjutkan.',
                'subscription_status' => $subscription?->status ?? 'none',
            ], 403);
        }

        return $next($request);
    }
}
