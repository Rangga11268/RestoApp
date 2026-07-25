<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        if (! $user->restaurant_id) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak terhubung ke restoran manapun.',
            ], 403);
        }

        if (! $user->restaurant || ! $user->restaurant->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Restoran Anda tidak aktif atau telah disuspend.',
            ], 403);
        }

        return $next($request);
    }
}
