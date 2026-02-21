<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50); // basic, pro, enterprise
            $table->decimal('price_monthly', 12, 2)->default(0);
            $table->integer('max_staff')->default(0);  // 0 = unlimited
            $table->integer('max_menu_items')->default(0);
            $table->integer('max_tables')->default(0);
            $table->json('features')->nullable(); // array of feature keys
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
