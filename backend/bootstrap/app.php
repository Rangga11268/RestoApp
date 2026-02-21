<?php

use App\Http\Middleware\CheckSubscriptionActive;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureTenantContext;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Redirect unauthenticated API requests to a JSON 401 — no 'login' route needed
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // triggers AuthenticationException → render() handler
            }
            return '/login';
        });

        // Alias middleware
        $middleware->alias([
            'role'         => EnsureRole::class,
            'tenant'       => EnsureTenantContext::class,
            'subscription' => CheckSubscriptionActive::class,
        ]);

        // Note: statefulApi() intentionally omitted — this app uses Bearer token auth,
        // not cookie-based SPA auth. Enabling it causes CSRF mismatch from localhost.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Always return JSON for /api/* routes
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
                ], 401);
            }
        });

        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();
