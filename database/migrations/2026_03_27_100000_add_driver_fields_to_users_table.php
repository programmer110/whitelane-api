<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone', 32)->nullable()->unique()->after('email');
            $table->string('username', 64)->nullable()->unique()->after('phone');
            $table->string('role', 32)->default('driver')->after('username');
            $table->boolean('must_reset_password')->default(false)->after('role');
            $table->boolean('is_online')->default(false)->after('must_reset_password');
            $table->decimal('last_lat', 10, 7)->nullable()->after('is_online');
            $table->decimal('last_lng', 10, 7)->nullable()->after('last_lat');
            $table->string('account_status', 32)->default('active')->after('last_lng');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'username',
                'role',
                'must_reset_password',
                'is_online',
                'last_lat',
                'last_lng',
                'account_status',
            ]);
        });
    }
};
