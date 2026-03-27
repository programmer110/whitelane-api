<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
    protected $fillable = [
        'pickup_address',
        'dropoff_address',
        'scheduled_at',
        'customer_display_name',
        'vehicle_type_label',
        'segment',
        'driver_status',
        'payment_paid',
        'driver_id',
        'pickup_lat',
        'pickup_lng',
        'dropoff_lat',
        'dropoff_lng',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'payment_paid' => 'boolean',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function scopeConfirmedForDriver($query)
    {
        return $query->where('payment_paid', true)
            ->where('driver_status', '!=', 'cancelled');
    }

    public function scopeVisibleToDriver($query, int $driverId)
    {
        return $query->where('driver_id', $driverId);
    }

    public function isConfirmedOperational(): bool
    {
        return $this->payment_paid && $this->driver_status !== 'cancelled';
    }
}
