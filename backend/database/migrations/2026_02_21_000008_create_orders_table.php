<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->restrictOnDelete();
            $table->string('order_number', 30)->unique(); // ORD-20260221-0001
            $table->foreignId('table_id')->nullable()->constrained('restaurant_tables')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('order_type', ['dine_in', 'take_away', 'delivery'])->default('dine_in');
            $table->enum('status', ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled'])
                ->default('pending');
            $table->text('notes')->nullable();
            $table->string('customer_name', 100)->nullable(); // untuk guest QR order
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid');
            $table->string('public_token', 64)->nullable()->unique(); // for guest order tracking
            $table->timestamps();

            $table->index('restaurant_id');
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
            $table->index('table_id');
            $table->index('public_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
