<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->restrictOnDelete();
            $table->string('menu_item_name', 150); // snapshot
            $table->smallInteger('quantity')->unsigned();
            $table->decimal('price_snapshot', 12, 2); // harga saat order dibuat
            $table->decimal('subtotal', 12, 2);
            $table->string('notes', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('order_id');
            $table->index('menu_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
