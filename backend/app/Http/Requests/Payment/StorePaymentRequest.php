<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id'        => ['required', 'integer', 'exists:orders,id'],
            'method'          => ['required', 'in:cash,debit_card,credit_card,qris,transfer'],
            'amount'          => ['required', 'numeric', 'min:0'],
            'transaction_ref' => ['nullable', 'string', 'max:100'],
            'notes'           => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'order_id.required' => 'Pilih pesanan yang akan dibayar.',
            'order_id.exists'   => 'Pesanan tidak ditemukan.',
            'method.required'   => 'Pilih metode pembayaran.',
            'method.in'         => 'Metode pembayaran tidak valid.',
            'amount.required'   => 'Masukkan jumlah pembayaran.',
            'amount.min'        => 'Jumlah pembayaran tidak boleh negatif.',
        ];
    }
}
