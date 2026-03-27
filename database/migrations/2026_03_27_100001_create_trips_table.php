<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->string('pickup_address');
            $table->string('dropoff_address');
            $table->dateTimeTz('scheduled_at');
            $table->string('customer_display_name');
            $table->string('vehicle_type_label')->default('Standard');
            $table->string('segment', 8)->default('b2c'); // b2b | b2c
            $table->string('driver_status', 40)->default('offered');
            $table->boolean('payment_paid')->default(false);
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();
            $table->decimal('dropoff_lat', 10, 7)->nullable();
            $table->decimal('dropoff_lng', 10, 7)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
