<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Driver-safe payload: no fare, payment details, or invoice fields.
 */
class DriverTripResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'pickup_address' => $this->pickup_address,
            'dropoff_address' => $this->dropoff_address,
            'scheduled_at' => $this->scheduled_at->toIso8601String(),
            'customer_display_name' => $this->customer_display_name,
            'vehicle_type_label' => $this->vehicle_type_label,
            'segment' => $this->segment,
            'driver_status' => $this->driver_status,
            'confirmed_for_driver' => $this->isConfirmedOperational(),
            'pickup_lat' => $this->pickup_lat !== null ? (float) $this->pickup_lat : null,
            'pickup_lng' => $this->pickup_lng !== null ? (float) $this->pickup_lng : null,
            'dropoff_lat' => $this->dropoff_lat !== null ? (float) $this->dropoff_lat : null,
            'dropoff_lng' => $this->dropoff_lng !== null ? (float) $this->dropoff_lng : null,
        ];
    }
}
