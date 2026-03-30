import { z } from 'zod';
import { rowToTrip } from '@/lib/db/mappers';
import { requireDriver } from '@/lib/guard';
import { jsonError } from '@/lib/http';
import { parseBigIntId } from '@/lib/id';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { findAuthorizedTrip } from '@/lib/trip-access';
import { driverTripJson } from '@/lib/trip-resource';

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
  const id = parseBigIntId(tripId);
  if (id === null) {
    return jsonError('forbidden', 'Action not allowed for trip state', 403);
  }
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

  const supabase = createSupabaseRouteClient();
  const { data: row, error } = await supabase
    .from('trips')
    .update({
      driver_status: body.driver_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id.toString())
    .select('*')
    .single();
  if (error) throw error;

  return Response.json(driverTripJson(rowToTrip(row as Record<string, unknown>)));
}
