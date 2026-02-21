<?php

namespace App\Http\Requests\Menu;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'      => ['required', 'integer', 'exists:menu_categories,id'],
            'name'             => ['required', 'string', 'max:150'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'price'            => ['required', 'numeric', 'min:0'],
            'image'            => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'is_available'     => ['nullable', 'boolean'],
            'is_featured'      => ['nullable', 'boolean'],
            'preparation_time' => ['nullable', 'integer', 'min:0', 'max:300'],
            'sort_order'       => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists'   => 'Kategori tidak ditemukan.',
            'name.required'        => 'Nama menu wajib diisi.',
            'price.required'       => 'Harga wajib diisi.',
            'price.min'            => 'Harga tidak boleh negatif.',
            'image.max'            => 'Ukuran gambar maksimal 2MB.',
            'image.image'          => 'File harus berupa gambar.',
        ];
    }
}
