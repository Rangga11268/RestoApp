<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'            => 'Trial',
                'price_monthly'   => 0,
                'max_staff'       => 3,
                'max_menu_items'  => 20,
                'max_tables'      => 5,
                'features'        => [
                    'pos'            => true,
                    'qr_order'       => false,
                    'reports'        => false,
                    'multi_cashier'  => false,
                    'export'         => false,
                    'api_access'     => false,
                    'priority_support' => false,
                ],
                'is_active' => true,
            ],
            [
                'name'            => 'Basic',
                'price_monthly'   => 99000,
                'max_staff'       => 5,
                'max_menu_items'  => 50,
                'max_tables'      => 10,
                'features'        => [
                    'pos'            => true,
                    'qr_order'       => true,
                    'reports'        => true,
                    'multi_cashier'  => false,
                    'export'         => false,
                    'api_access'     => false,
                    'priority_support' => false,
                ],
                'is_active' => true,
            ],
            [
                'name'            => 'Pro',
                'price_monthly'   => 249000,
                'max_staff'       => 20,
                'max_menu_items'  => 200,
                'max_tables'      => 50,
                'features'        => [
                    'pos'            => true,
                    'qr_order'       => true,
                    'reports'        => true,
                    'multi_cashier'  => true,
                    'export'         => true,
                    'api_access'     => false,
                    'priority_support' => false,
                ],
                'is_active' => true,
            ],
            [
                'name'            => 'Enterprise',
                'price_monthly'   => 599000,
                'max_staff'       => 0,   // 0 = unlimited
                'max_menu_items'  => 0,
                'max_tables'      => 0,
                'features'        => [
                    'pos'            => true,
                    'qr_order'       => true,
                    'reports'        => true,
                    'multi_cashier'  => true,
                    'export'         => true,
                    'api_access'     => true,
                    'priority_support' => true,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }

        $this->command->info('Subscription plans seeded: Trial, Basic, Pro, Enterprise.');
    }
}
