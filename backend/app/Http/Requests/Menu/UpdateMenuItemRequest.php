<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'      => ['sometimes', 'required', 'integer', 'exists:menu_categories,id'],
            'name'             => ['sometimes', 'required', 'string', 'max:150'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'price'            => ['sometimes', 'required', 'numeric', 'min:0'],
            'image'            => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_available'     => ['nullable', 'boolean'],
            'is_featured'      => ['nullable', 'boolean'],
            'preparation_time' => ['nullable', 'integer', 'min:0', 'max:300'],
            'sort_order'       => ['nullable', 'integer', 'min:0'],
        ];
    }
}
