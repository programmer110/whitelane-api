import { requireDriver } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const driverId = userOrRes.id;

  const trips = await prisma.trip.findMany({
    where: {
      driverId,
      paymentPaid: true,
      driverStatus: { notIn: ['completed', 'cancelled'] },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return Response.json(trips.map(driverTripJson));
}
