<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_id'      => ['nullable', 'integer', 'exists:restaurant_tables,id'],
            'order_type'    => ['required', 'in:dine_in,take_away,delivery'],
            'notes'         => ['nullable', 'string', 'max:500'],
            'customer_name' => ['nullable', 'string', 'max:100'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.quantity'     => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.notes'        => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'               => 'Pesanan harus memiliki minimal 1 item.',
            'items.*.menu_item_id.exists'  => 'Item menu tidak ditemukan.',
            'items.*.quantity.min'         => 'Jumlah item minimal 1.',
        ];
    }
}
