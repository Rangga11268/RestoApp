<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:confirmed,cooking,ready,completed,cancelled'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status tidak valid.',
        ];
    }
}
