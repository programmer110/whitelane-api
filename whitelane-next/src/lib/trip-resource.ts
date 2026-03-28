import type { Trip } from '@prisma/client';

function isConfirmedOperational(t: Trip): boolean {
  return t.paymentPaid && t.driverStatus !== 'cancelled';
}

function dec(v: { toString(): string } | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return Number(v.toString());
}

export function driverTripJson(t: Trip) {
  return {
    id: String(t.id),
    pickup_address: t.pickupAddress,
    dropoff_address: t.dropoffAddress,
    scheduled_at: t.scheduledAt.toISOString(),
    customer_display_name: t.customerDisplayName,
    vehicle_type_label: t.vehicleTypeLabel,
    segment: t.segment,
    driver_status: t.driverStatus,
    confirmed_for_driver: isConfirmedOperational(t),
    pickup_lat: dec(t.pickupLat),
    pickup_lng: dec(t.pickupLng),
    dropoff_lat: dec(t.dropoffLat),
    dropoff_lng: dec(t.dropoffLng),
  };
}
