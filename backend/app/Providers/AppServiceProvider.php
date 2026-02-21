<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Guard against mass-assignment and lazy loading in development
        Model::shouldBeStrict(! app()->isProduction());

        $this->configureRateLimiting();
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)
                ->by($request->user()?->id ?: $request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
                    ], 429);
                });
        });

        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.',
                    ], 429);
                });
        });

        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak permintaan. Coba lagi.',
                    ], 429);
                });
        });

        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinute(3)
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terlalu banyak permintaan reset password.',
                    ], 429);
                });
        });
    }
}
