import type { Trip } from '@/lib/db/types';

export function isConfirmedOperational(t: Trip): boolean {
  return t.paymentPaid && t.driverStatus !== 'cancelled';
}

export function isVisibleToDriver(t: Trip, driverId: bigint): boolean {
  return t.driverId === driverId;
}
