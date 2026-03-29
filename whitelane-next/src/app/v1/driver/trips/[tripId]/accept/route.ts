import { requireDriver } from '@/lib/guard';
import { jsonError } from '@/lib/http';
import { findAuthorizedTrip } from '@/lib/trip-access';
import { driverTripJson } from '@/lib/trip-resource';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const { tripId } = await context.params;
  const id = parseInt(tripId, 10);
  if (Number.isNaN(id)) {
    return jsonError('conflict', 'Trip no longer available', 409);
  }
  const model = await findAuthorizedTrip(id, userOrRes.id);

  if (!model || model.driverStatus !== 'offered') {
    return jsonError('conflict', 'Trip no longer available', 409);
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: { driverStatus: 'assigned' },
  });

  return Response.json(driverTripJson(updated));
}
