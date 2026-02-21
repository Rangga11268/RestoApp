<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\PasswordRule;

class PasswordResetController extends Controller
{
    use ApiResponse;

    /**
     * Send a password reset link email.
     */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink(['email' => $request->email]);

        if ($status === Password::RESET_LINK_SENT) {
            return $this->success(null, 'Link reset password telah dikirim ke email Anda.');
        }

        return $this->error('Email tidak ditemukan atau terlalu banyak permintaan.', 422);
    }

    /**
     * Reset the password using the token from the email link.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => ['required'],
            'email'    => ['required', 'email'],
            'password' => ['required', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all tokens to force re-login
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->success(null, 'Password berhasil direset. Silakan login dengan password baru.');
        }

        return $this->error('Token tidak valid atau sudah kadaluarsa.', 422);
    }
}
