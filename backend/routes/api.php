<?php

use App\Http\Controllers\API\Auth\AuthController;
use App\Http\Controllers\API\Auth\PasswordResetController;
use App\Http\Controllers\API\Auth\ProfileController;
use App\Http\Controllers\API\MenuCategoryController;
use App\Http\Controllers\API\MenuItemController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\PaymentController;
use App\Http\Controllers\API\PublicMenuController;
use App\Http\Controllers\API\RestaurantController;
use App\Http\Controllers\API\RestaurantTableController;
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
        Route::middleware(['tenant', 'subscription'])->group(function () {

            // ── Restaurant Settings ─────────────────────────
            Route::get('restaurant', [RestaurantController::class, 'show']);
            Route::post('restaurant', [RestaurantController::class, 'update']); // POST for multipart/form-data

            // ── Menu Categories ─────────────────────────────
            Route::get('menu/categories', [MenuCategoryController::class, 'index']);
            Route::post('menu/categories', [MenuCategoryController::class, 'store']);
            Route::get('menu/categories/{menuCategory}', [MenuCategoryController::class, 'show']);
            Route::put('menu/categories/{menuCategory}', [MenuCategoryController::class, 'update']);
            Route::delete('menu/categories/{menuCategory}', [MenuCategoryController::class, 'destroy']);
            Route::patch('menu/categories/reorder', [MenuCategoryController::class, 'reorder']);

            // ── Menu Items ──────────────────────────────────
            Route::get('menu/items', [MenuItemController::class, 'index']);
            Route::post('menu/items', [MenuItemController::class, 'store']);
            Route::get('menu/items/{menuItem}', [MenuItemController::class, 'show']);
            Route::post('menu/items/{menuItem}', [MenuItemController::class, 'update']); // POST for multipart/form-data
            Route::delete('menu/items/{menuItem}', [MenuItemController::class, 'destroy']);
            Route::patch('menu/items/{menuItem}/toggle', [MenuItemController::class, 'toggle']);

            // ── Tables ─────────────────────────────────────
            Route::get('tables', [RestaurantTableController::class, 'index']);
            Route::post('tables', [RestaurantTableController::class, 'store']);
            Route::get('tables/{restaurantTable}', [RestaurantTableController::class, 'show']);
            Route::put('tables/{restaurantTable}', [RestaurantTableController::class, 'update']);
            Route::delete('tables/{restaurantTable}', [RestaurantTableController::class, 'destroy']);
            Route::post('tables/{restaurantTable}/regenerate-qr', [RestaurantTableController::class, 'regenerateQr']);

            // ── Orders ──────────────────────────────────────
            Route::get('orders', [OrderController::class, 'index']);
            Route::post('orders', [OrderController::class, 'store']);
            Route::get('orders/{order}', [OrderController::class, 'show']);
            Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::delete('orders/{order}', [OrderController::class, 'destroy']);

            // ── Payments ────────────────────────────────────
            Route::get('payments/history', [PaymentController::class, 'history']);
            Route::post('payments/midtrans/snap-token', [PaymentController::class, 'snapToken']);
            Route::post('payments', [PaymentController::class, 'store']);
            Route::get('payments/{payment}', [PaymentController::class, 'show']);
            Route::patch('payments/{payment}/refund', [PaymentController::class, 'refund']);

            // ── Phase 4–6 routes added here progressively ──
        });
    });

    /*
    |--------------------------------------------------
    | Public Menu (no auth, no tenant scope)
    |--------------------------------------------------
    */
    Route::get('public/{slug}/menu', [PublicMenuController::class, 'menu'])
        ->middleware('throttle:60,1');

    Route::post('public/{slug}/orders', [PublicMenuController::class, 'createOrder'])
        ->middleware('throttle:30,1');

    /*
    |--------------------------------------------------
    | Midtrans Notification Webhook (no auth required)
    |--------------------------------------------------
    */
    Route::post('payments/midtrans/notification', [PaymentController::class, 'notification'])
        ->middleware('throttle:120,1');
});
