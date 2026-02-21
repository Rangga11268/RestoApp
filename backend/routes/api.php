<?php

use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\Auth\PasswordResetController;
use App\Http\Controllers\API\Auth\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------
    | Public Routes (no auth required)
    |--------------------------------------------------
    */
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
        Route::post('forgot-password', [PasswordResetController::class, 'sendResetLink'])->middleware('throttle:3,1');
        Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);
    });

    /*
    |--------------------------------------------------
    | Authenticated Routes
    |--------------------------------------------------
    */
    Route::middleware(['auth:sanctum'])->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [ProfileController::class, 'update']);
        Route::put('auth/password', [ProfileController::class, 'changePassword']);

        /*
        |----------------------------------------------
        | Tenant Routes (scoped to restaurant_id)
        |----------------------------------------------
        */
        Route::middleware(['tenant'])->group(function () {
            // These routes will be filled in Phase 2–6
            // Phase 2: menu, tables, restaurant settings
            // Phase 3: orders, kitchen
            // Phase 4: payments
            // Phase 5: reports
            // Phase 6: subscriptions, admin
        });
    });
});
