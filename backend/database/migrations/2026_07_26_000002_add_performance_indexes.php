<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Orders — foreign key indexes for cashier & customer filtering
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['restaurant_id', 'cashier_id'], 'idx_orders_restaurant_cashier');
            $table->index(['restaurant_id', 'customer_id'], 'idx_orders_restaurant_customer');
        });

        // Payments — cashier performance reports (no restaurant_id column; accessed via order)
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['cashier_id', 'status'], 'idx_payments_cashier_status');
        });

        // Tables — status & active filters (POS uses these heavily)
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->index(['restaurant_id', 'status'], 'idx_tables_restaurant_status');
            $table->index(['restaurant_id', 'is_active'], 'idx_tables_restaurant_active');
        });

        // Menu — active filter & sort order
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->index(['restaurant_id', 'is_active', 'sort_order'], 'idx_categories_active_sort');
        });

        // Reports query menu_items by restaurant + category + availability
        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['restaurant_id', 'category_id', 'is_available', 'sort_order'], 'idx_items_category_avail_sort');
        });

        // Notifications — unread count query on read_at
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'notifiable_type', 'read_at'], 'idx_notifications_unread');
        });

        // Soft-delete columns
        Schema::table('menu_items', function (Blueprint $table) {
            $table->index(['restaurant_id', 'deleted_at'], 'idx_items_restaurant_deleted');
        });
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->index(['restaurant_id', 'deleted_at'], 'idx_categories_restaurant_deleted');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_restaurant_cashier');
            $table->dropIndex('idx_orders_restaurant_customer');
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_cashier_status');
        });
        Schema::table('restaurant_tables', function (Blueprint $table) {
            $table->dropIndex('idx_tables_restaurant_status');
            $table->dropIndex('idx_tables_restaurant_active');
        });
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropIndex('idx_categories_active_sort');
            $table->dropIndex('idx_categories_restaurant_deleted');
        });
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex('idx_items_category_avail_sort');
            $table->dropIndex('idx_items_restaurant_deleted');
        });
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notifications_unread');
        });
    }
};
