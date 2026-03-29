import { requireDriver } from '@/lib/guard';
import { jsonError } from '@/lib/http';
import { findAuthorizedTrip } from '@/lib/trip-access';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const { tripId } = await context.params;
  const id = parseInt(tripId, 10);
  if (Number.isNaN(id)) {
    return jsonError('forbidden', 'Trip not available', 403);
  }
  const model = await findAuthorizedTrip(id, userOrRes.id);
  if (!model) {
    return jsonError('forbidden', 'Trip not available', 403);
  }
  return Response.json(driverTripJson(model));
}
