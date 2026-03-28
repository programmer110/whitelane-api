import { requireDriver } from '@/lib/guard';
import { prisma } from '@/lib/prisma';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '20', 10) || 20));

  // Matches Laravel: confirmedForDriver + visible + whereIn(completed,cancelled) effectively yields only `completed`.
  const trips = await prisma.trip.findMany({
    where: {
      driverId: userOrRes.id,
      paymentPaid: true,
      driverStatus: 'completed',
    },
    orderBy: { scheduledAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return Response.json(trips.map(driverTripJson));
}
