<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:50'],
            'capacity'  => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Nama meja wajib diisi.',
            'capacity.required' => 'Kapasitas meja wajib diisi.',
            'capacity.min'      => 'Kapasitas minimal 1 orang.',
        ];
    }
}
