import type { Trip } from '@prisma/client';
import { prisma } from './prisma';
import { isConfirmedOperational } from './trip-policy';

export async function findAuthorizedTrip(tripId: bigint, driverId: bigint): Promise<Trip | null> {
  const model = await prisma.trip.findFirst({
    where: { id: tripId, driverId },
  });
  if (!model || !isConfirmedOperational(model)) return null;
  return model;
}
