<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email    = env('SUPERADMIN_EMAIL', 'superadmin@restosaas.id');
        $password = env('SUPERADMIN_PASSWORD', 'SuperAdmin@2025!');
        $name     = env('SUPERADMIN_NAME', 'Super Administrator');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'              => $name,
                'password'          => Hash::make($password),
                'role'              => 'superadmin',
                'restaurant_id'     => null,
                'is_active'         => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Super admin seeded: {$user->email}");
        $this->command->warn("Default password is set. Update SUPERADMIN_PASSWORD in .env for production!");
    }
}
