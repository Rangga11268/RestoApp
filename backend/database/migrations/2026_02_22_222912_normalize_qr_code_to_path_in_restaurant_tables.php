<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Konversi qr_code lama (base64 SVG embed URL) ke format path saja.
     * Contoh lama : data:image/svg+xml;base64,...
     * Contoh baru : /menu/warung-sate-pak-budi?table=1
     *
     * Frontend yang akan generate QR image menggunakan window.location.origin + path,
     * sehingga QR selalu valid di lokal (IP berubah) maupun production (custom domain).
     */
    public function up(): void
    {
        $tables = DB::table('restaurant_tables')
            ->join('restaurants', 'restaurant_tables.restaurant_id', '=', 'restaurants.id')
            ->select('restaurant_tables.id', 'restaurants.slug')
            ->get();

        foreach ($tables as $row) {
            DB::table('restaurant_tables')
                ->where('id', $row->id)
                ->update(['qr_code' => "/menu/{$row->slug}?table={$row->id}"]);
        }
    }

    public function down(): void
    {
        // Tidak bisa di-rollback ke base64 SVG lama — set null saja
        DB::table('restaurant_tables')->update(['qr_code' => null]);
    }
};
