<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\RestaurantTable;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    private const PASS = 'Demo1234!';

    public function run(): void
    {
        $proPlan   = SubscriptionPlan::where('name', 'Pro')->first();
        $basicPlan = SubscriptionPlan::where('name', 'Basic')->first();

        /* ══════════════════════════════════════════════════════
         * RESTORAN 1 — Warung Makan Bu Sari  (Pro · Active)
         * ══════════════════════════════════════════════════════ */
        $resto1 = Restaurant::updateOrCreate(
            ['slug' => 'warung-bu-sari'],
            [
                'name'      => 'Warung Makan Bu Sari',
                'email'     => 'info@warbusari.id',
                'phone'     => '081234567890',
                'address'   => 'Jl. Mawar No. 12, Jakarta Selatan',
                'timezone'  => 'Asia/Jakarta',
                'currency'  => 'IDR',
                'is_active' => true,
                'settings'  => ['tax_rate' => 10],
            ]
        );

        // Subscription
        Subscription::updateOrCreate(
            ['restaurant_id' => $resto1->id],
            [
                'plan_id'   => $proPlan->id,
                'status'    => 'active',
                'starts_at' => now()->subMonth(),
                'ends_at'   => now()->addMonth(),
            ]
        );

        // Users
        $owner1 = User::updateOrCreate(
            ['email' => 'owner@demo.com'],
            [
                'name'              => 'Budi Santoso',
                'password'          => Hash::make(self::PASS),
                'role'              => 'owner',
                'restaurant_id'     => $resto1->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '081111111111',
            ]
        );

        $manager1 = User::updateOrCreate(
            ['email' => 'manager@demo.com'],
            [
                'name'              => 'Rina Wulandari',
                'password'          => Hash::make(self::PASS),
                'role'              => 'manager',
                'restaurant_id'     => $resto1->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '082222222222',
            ]
        );

        $cashier1 = User::updateOrCreate(
            ['email' => 'kasir@demo.com'],
            [
                'name'              => 'Doni Pratama',
                'password'          => Hash::make(self::PASS),
                'role'              => 'cashier',
                'restaurant_id'     => $resto1->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '083333333333',
            ]
        );

        User::updateOrCreate(
            ['email' => 'dapur@demo.com'],
            [
                'name'              => 'Eko Prasetyo',
                'password'          => Hash::make(self::PASS),
                'role'              => 'kitchen',
                'restaurant_id'     => $resto1->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '084444444444',
            ]
        );

        // Menu Categories
        $makanan = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto1->id, 'name' => 'Makanan Utama'],
            ['description' => 'Menu andalan kami', 'sort_order' => 1, 'is_active' => true]
        );
        $minuman = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto1->id, 'name' => 'Minuman'],
            ['description' => 'Minuman segar pilihan', 'sort_order' => 2, 'is_active' => true]
        );
        $snack = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto1->id, 'name' => 'Snack & Gorengan'],
            ['description' => 'Camilan pelengkap', 'sort_order' => 3, 'is_active' => true]
        );
        $dessert = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto1->id, 'name' => 'Dessert'],
            ['description' => 'Penutup yang manis', 'sort_order' => 4, 'is_active' => true]
        );

        // Menu Items — Makanan Utama
        $menuItems1 = [
            ['name' => 'Nasi Goreng Spesial',     'price' => 25000, 'desc' => 'Nasi goreng dengan telur, ayam, dan udang. Disajikan dengan kerupuk dan acar.', 'featured' => true,  'prep' => 12],
            ['name' => 'Mie Goreng Jawa',          'price' => 22000, 'desc' => 'Mie goreng bumbu Jawa dengan sayuran segar dan telur.',                          'featured' => false, 'prep' => 10],
            ['name' => 'Ayam Bakar Kecap',         'price' => 35000, 'desc' => 'Ayam bakar dengan bumbu kecap manis, disajikan dengan lalapan dan sambal.',      'featured' => true,  'prep' => 20],
            ['name' => 'Soto Ayam Bening',         'price' => 20000, 'desc' => 'Soto ayam bening dengan suwiran ayam, telur, dan bihun.',                        'featured' => false, 'prep' => 8],
            ['name' => 'Gado-Gado Surabaya',       'price' => 18000, 'desc' => 'Sayuran rebus dengan saus kacang khas Surabaya dan kerupuk.',                    'featured' => false, 'prep' => 10],
        ];
        foreach ($menuItems1 as $i => $item) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto1->id, 'name' => $item['name']],
                [
                    'category_id'      => $makanan->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => true,
                    'is_featured'      => $item['featured'],
                    'preparation_time' => $item['prep'],
                    'sort_order'       => $i + 1,
                ]
            );
        }

        // Menu Items — Minuman
        $menuItems2 = [
            ['name' => 'Es Teh Manis',     'price' => 5000,  'desc' => 'Teh manis dingin yang menyegarkan.',                'featured' => false, 'prep' => 3],
            ['name' => 'Es Jeruk Segar',   'price' => 8000,  'desc' => 'Jeruk peras segar dengan es batu.',                 'featured' => false, 'prep' => 3],
            ['name' => 'Jus Alpukat',      'price' => 15000, 'desc' => 'Jus alpukat creamy dengan susu kental manis.',      'featured' => true,  'prep' => 5],
            ['name' => 'Es Cincau Hitam',  'price' => 7000,  'desc' => 'Cincau hitam dengan santan dan gula aren.',         'featured' => false, 'prep' => 3],
        ];
        foreach ($menuItems2 as $i => $item) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto1->id, 'name' => $item['name']],
                [
                    'category_id'      => $minuman->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => true,
                    'is_featured'      => $item['featured'],
                    'preparation_time' => $item['prep'],
                    'sort_order'       => $i + 1,
                ]
            );
        }

        // Menu Items — Snack
        $menuItems3 = [
            ['name' => 'Tempe Mendoan',  'price' => 8000,  'desc' => 'Tempe goreng tepung khas Banyumas, disajikan dengan cabe rawit.',  'featured' => false, 'prep' => 7],
            ['name' => 'Pisang Goreng',  'price' => 10000, 'desc' => 'Pisang goreng crispy dengan taburan keju parut.',                  'featured' => false, 'prep' => 8],
            ['name' => 'Tahu Isi Pedes', 'price' => 8000,  'desc' => 'Tahu goreng berisi sayuran dengan sambal pedas.',                  'featured' => false, 'prep' => 7],
        ];
        foreach ($menuItems3 as $i => $item) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto1->id, 'name' => $item['name']],
                [
                    'category_id'      => $snack->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => true,
                    'is_featured'      => $item['featured'],
                    'preparation_time' => $item['prep'],
                    'sort_order'       => $i + 1,
                ]
            );
        }

        // Menu Items — Dessert (satu unavailable buat test)
        $menuItems4 = [
            ['name' => 'Klepon',            'price' => 10000, 'desc' => 'Kue klepon isi gula aren dengan taburan kelapa parut.', 'featured' => false, 'prep' => 5, 'avail' => true],
            ['name' => 'Es Krim Alpukat',   'price' => 18000, 'desc' => 'Es krim alpukat premium dengan topping cokelat.',      'featured' => true,  'prep' => 3, 'avail' => true],
            ['name' => 'Puding Cokelat',    'price' => 12000, 'desc' => 'Puding cokelat lembut dengan saus vanilla.',           'featured' => false, 'prep' => 0, 'avail' => false],
        ];
        foreach ($menuItems4 as $i => $item) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto1->id, 'name' => $item['name']],
                [
                    'category_id'      => $dessert->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => $item['avail'],
                    'is_featured'      => $item['featured'],
                    'preparation_time' => $item['prep'],
                    'sort_order'       => $i + 1,
                ]
            );
        }

        // Restaurant Tables
        $tables1 = [];
        $tableData = [
            ['name' => 'Meja 1', 'capacity' => 2, 'status' => 'available'],
            ['name' => 'Meja 2', 'capacity' => 2, 'status' => 'occupied'],
            ['name' => 'Meja 3', 'capacity' => 4, 'status' => 'occupied'],
            ['name' => 'Meja 4', 'capacity' => 4, 'status' => 'available'],
            ['name' => 'Meja 5', 'capacity' => 6, 'status' => 'available'],
            ['name' => 'Meja 6', 'capacity' => 6, 'status' => 'available'],
            ['name' => 'VIP A',  'capacity' => 8, 'status' => 'reserved'],
            ['name' => 'VIP B',  'capacity' => 8, 'status' => 'available'],
        ];
        foreach ($tableData as $td) {
            $table = RestaurantTable::updateOrCreate(
                ['restaurant_id' => $resto1->id, 'name' => $td['name']],
                ['capacity' => $td['capacity'], 'status' => $td['status'], 'is_active' => true]
            );
            if (empty($table->qr_code)) {
                $table->update(['qr_code' => $this->generateQr($resto1->slug, $table->id)]);
            }
            $tables1[] = $table;
        }

        // Sample Orders — berbagai status
        $this->seedOrders($resto1->id, $cashier1->id, $tables1, $makanan->id, $minuman->id);

        $this->command->info("✓ Restoran 1: {$resto1->name} (Pro, Active)");

        /* ══════════════════════════════════════════════════════
         * RESTORAN 2 — Kafe Santai  (Basic · Trialing)
         * ══════════════════════════════════════════════════════ */
        $resto2 = Restaurant::updateOrCreate(
            ['slug' => 'kafe-santai'],
            [
                'name'      => 'Kafe Santai',
                'email'     => 'halo@kafesantai.id',
                'phone'     => '089876543210',
                'address'   => 'Jl. Melati No. 45, Bandung',
                'timezone'  => 'Asia/Jakarta',
                'currency'  => 'IDR',
                'is_active' => true,
                'settings'  => ['tax_rate' => 0],
            ]
        );

        Subscription::updateOrCreate(
            ['restaurant_id' => $resto2->id],
            [
                'plan_id'       => $basicPlan->id,
                'status'        => 'trialing',
                'trial_ends_at' => now()->addDays(5),
                'starts_at'     => null,
                'ends_at'       => null,
            ]
        );

        $owner2 = User::updateOrCreate(
            ['email' => 'owner2@demo.com'],
            [
                'name'              => 'Siti Rahayu',
                'password'          => Hash::make(self::PASS),
                'role'              => 'owner',
                'restaurant_id'     => $resto2->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '085555555555',
            ]
        );

        $cashier2 = User::updateOrCreate(
            ['email' => 'kasir2@demo.com'],
            [
                'name'              => 'Hendra Wijaya',
                'password'          => Hash::make(self::PASS),
                'role'              => 'cashier',
                'restaurant_id'     => $resto2->id,
                'is_active'         => true,
                'email_verified_at' => now(),
                'phone'             => '086666666666',
            ]
        );

        $kopiCat = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto2->id, 'name' => 'Kopi & Minuman'],
            ['description' => 'Kopi spesialti dan minuman kekinian', 'sort_order' => 1, 'is_active' => true]
        );
        $cemilanCat = MenuCategory::updateOrCreate(
            ['restaurant_id' => $resto2->id, 'name' => 'Cemilan'],
            ['description' => 'Cocok teman ngopi', 'sort_order' => 2, 'is_active' => true]
        );

        $kopiItems = [
            ['name' => 'Americano',       'price' => 22000, 'desc' => 'Espresso dengan air panas, rasa kopi murni.', 'featured' => true],
            ['name' => 'Cappuccino',      'price' => 28000, 'desc' => 'Espresso dengan steamed milk dan foam.',      'featured' => true],
            ['name' => 'Matcha Latte',    'price' => 32000, 'desc' => 'Matcha Jepang premium dengan susu oat.',      'featured' => false],
            ['name' => 'Es Kopi Susu',    'price' => 25000, 'desc' => 'Kopi susu khas kafe, manis dan creamy.',     'featured' => false],
        ];
        foreach ($kopiItems as $i => $item) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto2->id, 'name' => $item['name']],
                [
                    'category_id'      => $kopiCat->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => true,
                    'is_featured'      => $item['featured'],
                    'preparation_time' => 5,
                    'sort_order'       => $i + 1,
                ]
            );
        }
        foreach (
            [
                ['name' => 'Croissant Mentega', 'price' => 18000, 'desc' => 'Croissant renyah dengan mentega Prancis.'],
                ['name' => 'Brownies Panggang', 'price' => 20000, 'desc' => 'Brownies cokelat moist yang lezat.'],
            ] as $i => $item
        ) {
            MenuItem::updateOrCreate(
                ['restaurant_id' => $resto2->id, 'name' => $item['name']],
                [
                    'category_id'      => $cemilanCat->id,
                    'description'      => $item['desc'],
                    'price'            => $item['price'],
                    'is_available'     => true,
                    'is_featured'      => false,
                    'preparation_time' => 5,
                    'sort_order'       => $i + 1,
                ]
            );
        }

        $tables2 = [];
        foreach (
            [
                ['name' => 'Meja A', 'capacity' => 2],
                ['name' => 'Meja B', 'capacity' => 4],
                ['name' => 'Meja C', 'capacity' => 4],
                ['name' => 'Outdoor', 'capacity' => 6],
            ] as $td
        ) {
            $table = RestaurantTable::updateOrCreate(
                ['restaurant_id' => $resto2->id, 'name' => $td['name']],
                ['capacity' => $td['capacity'], 'status' => 'available', 'is_active' => true]
            );
            if (empty($table->qr_code)) {
                $table->update(['qr_code' => $this->generateQr($resto2->slug, $table->id)]);
            }
            $tables2[] = $table;
        }

        // Satu order pending untuk resto2
        $americano = MenuItem::where('restaurant_id', $resto2->id)->where('name', 'Americano')->first();
        $cappuccino = MenuItem::where('restaurant_id', $resto2->id)->where('name', 'Cappuccino')->first();
        $qty1 = 2;
        $qty2 = 1;
        $subtotal = ($americano->price * $qty1) + ($cappuccino->price * $qty2);
        $orderNum = 'ORD-' . now()->format('Ymd') . '-0010';
        if (! Order::where('order_number', $orderNum)->exists()) {
            $order = Order::create([
                'restaurant_id'   => $resto2->id,
                'order_number'    => $orderNum,
                'table_id'        => $tables2[0]->id,
                'cashier_id'      => $cashier2->id,
                'order_type'      => 'dine_in',
                'status'          => 'pending',
                'customer_name'   => 'Tamu',
                'subtotal'        => $subtotal,
                'discount_amount' => 0,
                'tax_amount'      => 0,
                'total'           => $subtotal,
                'payment_status'  => 'unpaid',
                'public_token'    => Str::random(32),
            ]);
            OrderItem::insert([
                ['order_id' => $order->id, 'menu_item_id' => $americano->id, 'menu_item_name' => $americano->name, 'quantity' => $qty1, 'price_snapshot' => $americano->price, 'subtotal' => $americano->price * $qty1],
                ['order_id' => $order->id, 'menu_item_id' => $cappuccino->id, 'menu_item_name' => $cappuccino->name, 'quantity' => $qty2, 'price_snapshot' => $cappuccino->price, 'subtotal' => $cappuccino->price * $qty2],
            ]);
        }

        $this->command->info("✓ Restoran 2: {$resto2->name} (Basic, Trial 5 hari)");

        // Summary
        $this->command->newLine();
        $this->command->line('┌─────────────────────────────────────────────────────┐');
        $this->command->line('│              AKUN DEMO TERSEDIA                     │');
        $this->command->line('├─────────────────┬───────────────────────────────────┤');
        $this->command->line('│ Role            │ Email                             │');
        $this->command->line('├─────────────────┼───────────────────────────────────┤');
        $this->command->line('│ Super Admin     │ superadmin@restosaas.id           │');
        $this->command->line('│ Owner (Resto 1) │ owner@demo.com                    │');
        $this->command->line('│ Manager         │ manager@demo.com                  │');
        $this->command->line('│ Kasir           │ kasir@demo.com                    │');
        $this->command->line('│ Dapur/Kitchen   │ dapur@demo.com                    │');
        $this->command->line('│ Owner (Resto 2) │ owner2@demo.com                   │');
        $this->command->line('│ Kasir 2         │ kasir2@demo.com                   │');
        $this->command->line('├─────────────────┴───────────────────────────────────┤');
        $this->command->line('│ Password semua (kecuali superadmin): Demo1234!      │');
        $this->command->line('│ Password superadmin: SuperAdmin@2025!               │');
        $this->command->line('└─────────────────────────────────────────────────────┘');
    }

    private function seedOrders(int $restaurantId, int $cashierId, array $tables, int $makananCatId, int $minumanCatId): void
    {
        $nasiGoreng = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Nasi Goreng Spesial')->first();
        $mieGoreng  = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Mie Goreng Jawa')->first();
        $ayamBakar  = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Ayam Bakar Kecap')->first();
        $esTeh      = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Es Teh Manis')->first();
        $esJeruk    = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Es Jeruk Segar')->first();
        $jusAlpukat = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Jus Alpukat')->first();
        $tempe      = MenuItem::where('restaurant_id', $restaurantId)->where('name', 'Tempe Mendoan')->first();

        $datePrefix = 'ORD-' . now()->format('Ymd') . '-';

        $orderDefs = [
            [
                'num'    => $datePrefix . '0001',
                'table'  => $tables[0],
                'status' => 'pending',
                'type'   => 'dine_in',
                'name'   => 'Pak Agus',
                'items'  => [
                    [$nasiGoreng, 1, 'Extra pedas'],
                    [$esTeh, 2, null],
                ],
            ],
            [
                'num'    => $datePrefix . '0002',
                'table'  => $tables[1],
                'status' => 'confirmed',
                'type'   => 'dine_in',
                'name'   => 'Bu Dewi',
                'items'  => [
                    [$mieGoreng, 2, null],
                    [$esJeruk, 2, null],
                    [$tempe, 1, null],
                ],
            ],
            [
                'num'    => $datePrefix . '0003',
                'table'  => $tables[2],
                'status' => 'cooking',
                'type'   => 'dine_in',
                'name'   => 'Rombongan',
                'items'  => [
                    [$ayamBakar, 3, null],
                    [$nasiGoreng, 1, 'Tanpa bawang'],
                    [$jusAlpukat, 3, null],
                ],
            ],
            [
                'num'    => $datePrefix . '0004',
                'table'  => $tables[3],
                'status' => 'ready',
                'type'   => 'dine_in',
                'name'   => 'Mas Rendi',
                'items'  => [
                    [$mieGoreng, 1, null],
                    [$esTeh, 1, 'Less sweet'],
                ],
            ],
            [
                'num'    => $datePrefix . '0005',
                'table'  => null,
                'status' => 'completed',
                'type'   => 'take_away',
                'name'   => 'Online Order',
                'items'  => [
                    [$nasiGoreng, 2, null],
                    [$ayamBakar, 1, null],
                    [$esJeruk, 3, null],
                ],
                'paid' => true,
            ],
            [
                'num'    => $datePrefix . '0006',
                'table'  => $tables[5],
                'status' => 'cancelled',
                'type'   => 'dine_in',
                'name'   => 'Pak Budi',
                'items'  => [
                    [$ayamBakar, 1, null],
                    [$esTeh, 1, null],
                ],
            ],
        ];

        foreach ($orderDefs as $def) {
            if (Order::where('order_number', $def['num'])->exists()) {
                continue;
            }

            $subtotal = 0;
            $itemRows = [];
            foreach ($def['items'] as [$menuItem, $qty, $note]) {
                $line      = $menuItem->price * $qty;
                $subtotal += $line;
                $itemRows[] = [
                    'menu_item_id'   => $menuItem->id,
                    'menu_item_name' => $menuItem->name,
                    'quantity'       => $qty,
                    'price_snapshot' => $menuItem->price,
                    'subtotal'       => $line,
                    'notes'          => $note,
                ];
            }

            $paid = $def['paid'] ?? false;

            $order = Order::create([
                'restaurant_id'   => $restaurantId,
                'order_number'    => $def['num'],
                'table_id'        => $def['table']?->id,
                'cashier_id'      => $cashierId,
                'order_type'      => $def['type'],
                'status'          => $def['status'],
                'customer_name'   => $def['name'],
                'notes'           => null,
                'subtotal'        => $subtotal,
                'discount_amount' => 0,
                'tax_amount'      => $restaurantId ? (int) round($subtotal * 0.1) : 0,
                'total'           => $subtotal + (int) round($subtotal * 0.1),
                'payment_status'  => $paid ? 'paid' : 'unpaid',
                'public_token'    => Str::random(32),
            ]);

            OrderItem::insert(array_map(
                fn($row) => array_merge($row, ['order_id' => $order->id]),
                $itemRows
            ));
        }
    }

    private function generateQr(string $restaurantSlug, int $tableId): string
    {
        // Simpan path saja — frontend generate QR image pakai window.location.origin + path
        return "/menu/{$restaurantSlug}?table={$tableId}";
    }
}
