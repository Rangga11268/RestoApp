<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Traits\ApiResponse;
use App\Models\ActivityLog;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new restaurant owner + restaurant.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = DB::transaction(function () use ($data) {
            $restaurant = Restaurant::create([
                'name'     => $data['restaurant_name'],
                'slug'     => Str::slug($data['restaurant_name']) . '-' . Str::random(4),
                'email'    => $data['email'],
                'timezone' => $data['timezone'] ?? 'Asia/Jakarta',
                'currency' => 'IDR',
            ]);

            $user = User::create([
                'restaurant_id' => $restaurant->id,
                'name'          => $data['name'],
                'email'         => $data['email'],
                'password'      => Hash::make($data['password']),
                'role'          => 'owner',
            ]);

            return $user;
        });

        $token = $result->createToken('auth_token')->plainTextToken;

        ActivityLog::log('user.register', $result);

        return $this->created([
            'token' => $token,
            'user'  => $this->userResponse($result),
        ], 'Registrasi berhasil. Selamat datang! Anda mendapatkan 14 hari masa trial gratis.');
    }

    /**
     * Login and return a Sanctum token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->error('Email atau password salah.', 401);
        }

        if (! $user->is_active) {
            return $this->error('Akun Anda tidak aktif. Hubungi administrator.', 403);
        }

        // Revoke old tokens (single session per user)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        ActivityLog::log('user.login', $user, ['ip' => $request->ip()]);

        return $this->success([
            'token' => $token,
            'user'  => $this->userResponse($user),
        ], 'Login berhasil.');
    }

    /**
     * Logout — revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        ActivityLog::log('user.logout', $request->user());
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logout berhasil.');
    }

    /**
     * Return the authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['restaurant']);
        return $this->success($this->userResponse($user, true));
    }

    /* ─────────────── Private ─────────────── */

    private function userResponse(User $user, bool $withRestaurant = false): array
    {
        $data = [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'phone'      => $user->phone,
            'avatar_url' => $user->avatar_url,
            'is_active'  => $user->is_active,
        ];

        if ($withRestaurant && $user->restaurant) {
            $data['restaurant'] = [
                'id'       => $user->restaurant->id,
                'name'     => $user->restaurant->name,
                'slug'     => $user->restaurant->slug,
                'timezone' => $user->restaurant->timezone,
                'currency' => $user->restaurant->currency,
                'logo_url' => $user->restaurant->logo_url,
                'settings' => $user->restaurant->settings,
            ];
        }

        return $data;
    }
}
