<?php

namespace App\Http\Requests\Staff;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    private const STAFF_ROLES = ['manager', 'cashier', 'kitchen'];

    public function authorize(): bool
    {
        return true; // Role enforcement handled in controller
    }

    public function rules(): array
    {
        // userId from route parameter for unique ignore
        $userId = $this->route('userId');

        return [
            'name'     => ['sometimes', 'required', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', 'max:150', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'role'     => ['sometimes', Rule::in(self::STAFF_ROLES)],
            'phone'    => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'      => 'Email sudah digunakan oleh akun lain.',
            'password.min'      => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'role.in'           => 'Role tidak valid. Pilih: manager, cashier, atau kitchen.',
        ];
    }
}
