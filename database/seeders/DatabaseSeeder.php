<?php

namespace Database\Seeders;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $driver = User::factory()->create([
            'name' => 'Demo Driver',
            'email' => 'driver@whitelane.local',
            'username' => 'driver1',
            'phone' => '+10000000001',
            'role' => 'driver',
            'must_reset_password' => false,
            'account_status' => 'active',
            'password' => 'password',
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@whitelane.local',
            'role' => 'admin',
            'username' => 'admin1',
        ]);

        Trip::query()->create([
            'pickup_address' => 'King Fahd Rd, Riyadh',
            'dropoff_address' => 'Olaya St, Riyadh',
            'scheduled_at' => now()->addHours(2),
            'customer_display_name' => 'Customer A',
            'vehicle_type_label' => 'Sedan',
            'segment' => 'b2c',
            'driver_status' => 'offered',
            'payment_paid' => true,
            'driver_id' => $driver->id,
            'pickup_lat' => 24.7136,
            'pickup_lng' => 46.6753,
            'dropoff_lat' => 24.7500,
            'dropoff_lng' => 46.7000,
        ]);

        Trip::query()->create([
            'pickup_address' => 'Airport T1',
            'dropoff_address' => 'Business District',
            'scheduled_at' => now()->addDay(),
            'customer_display_name' => 'Customer B',
            'vehicle_type_label' => 'SUV',
            'segment' => 'b2b',
            'driver_status' => 'assigned',
            'payment_paid' => true,
            'driver_id' => $driver->id,
            'pickup_lat' => 24.9600,
            'pickup_lng' => 46.6989,
            'dropoff_lat' => 24.7200,
            'dropoff_lng' => 46.6800,
        ]);
    }
}
