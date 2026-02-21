<?php

namespace App\Http\Controllers\API\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Traits\ApiResponse;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Update name, phone, and avatar_url.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        ActivityLog::log('profile.update', $user);

        return $this->success([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'avatar_url' => $user->avatar_url,
        ], 'Profil berhasil diperbarui.');
    }

    /**
     * Change password — requires current password confirmation.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak sesuai.'],
            ]);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        // Revoke all tokens — force re-login on all devices
        $user->tokens()->delete();

        ActivityLog::log('profile.password_changed', $user);

        return $this->success(null, 'Password berhasil diubah. Silakan login kembali.');
    }
}
