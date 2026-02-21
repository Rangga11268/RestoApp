<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['sometimes', 'required', 'string', 'max:50'],
            'capacity'  => ['sometimes', 'required', 'integer', 'min:1', 'max:100'],
            'status'    => ['nullable', 'in:available,occupied,reserved,inactive'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
