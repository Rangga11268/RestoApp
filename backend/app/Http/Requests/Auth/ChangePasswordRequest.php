<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.different'  => 'Password baru harus berbeda dari password lama.',
            'new_password.confirmed'  => 'Konfirmasi password baru tidak cocok.',
            'new_password.min'        => 'Password baru minimal 8 karakter.',
        ];
    }
}
