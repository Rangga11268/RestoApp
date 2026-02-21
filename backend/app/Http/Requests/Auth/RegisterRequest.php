<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:100'],
            'email'           => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password'        => ['required', 'string', 'min:8', 'confirmed'],
            'restaurant_name' => ['required', 'string', 'max:150'],
            'timezone'        => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'    => 'Email ini sudah terdaftar.',
            'password.min'    => 'Password minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }
}
