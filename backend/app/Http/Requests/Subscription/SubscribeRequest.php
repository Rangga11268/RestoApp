<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'months'  => ['nullable', 'integer', 'min:1', 'max:12'],
        ];
    }

    public function messages(): array
    {
        return [
            'plan_id.required' => 'Paket berlangganan wajib dipilih.',
            'plan_id.exists'   => 'Paket berlangganan tidak ditemukan.',
            'months.min'       => 'Minimum berlangganan 1 bulan.',
            'months.max'       => 'Maksimum berlangganan 12 bulan sekaligus.',
        ];
    }
}
