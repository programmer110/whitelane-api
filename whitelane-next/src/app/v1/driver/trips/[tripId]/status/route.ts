import { z } from 'zod';
import { requireDriver } from '@/lib/guard';
import { jsonError } from '@/lib/http';
import { findAuthorizedTrip } from '@/lib/trip-access';
import { driverTripJson } from '@/lib/trip-resource';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const bodySchema = z.object({
  driver_status: z.enum(['navigating_to_pickup', 'arrived', 'in_progress', 'completed']),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ message: 'Validation failed', errors: {} }, { status: 422 });
  }

  const { tripId } = await context.params;
  const id = BigInt(tripId);
  const model = await findAuthorizedTrip(id, userOrRes.id);

  if (!model) {
    return jsonError('forbidden', 'Action not allowed for trip state', 403);
  }

  if (body.driver_status === 'completed' && !model.paymentPaid) {
    return jsonError('forbidden', 'Action not allowed for trip state', 403);
  }

  if (model.driverStatus === 'completed') {
    return jsonError('forbidden', 'Action not allowed for trip state', 403);
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: { driverStatus: body.driver_status },
  });

  return Response.json(driverTripJson(updated));
}
