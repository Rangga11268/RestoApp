<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurants', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 100)->unique();
            $table->string('email', 150)->unique();
            $table->string('phone', 20)->nullable();
            $table->text('address')->nullable();
            $table->string('logo_url', 255)->nullable();
            $table->string('timezone', 50)->default('Asia/Jakarta');
            $table->string('currency', 10)->default('IDR');
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable(); // {"tax_rate": 10, "service_charge": 5, ...}
            $table->timestamps();

            $table->index('slug');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurants');
    }
};
