import { rowToTrip } from '@/lib/db/mappers';
import { requireDriver } from '@/lib/guard';
import { jsonError } from '@/lib/http';
import { parseBigIntId } from '@/lib/id';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { findAuthorizedTrip } from '@/lib/trip-access';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> },
) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const { tripId } = await context.params;
  const id = parseBigIntId(tripId);
  if (id === null) {
    return jsonError('conflict', 'Trip no longer available', 409);
  }
  const model = await findAuthorizedTrip(id, userOrRes.id);

  if (!model || model.driverStatus !== 'offered') {
    return jsonError('conflict', 'Trip no longer available', 409);
  }

  const supabase = createSupabaseRouteClient();
  const { data: row, error } = await supabase
    .from('trips')
    .update({
      driver_status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id.toString())
    .select('*')
    .single();
  if (error) throw error;

  return Response.json(driverTripJson(rowToTrip(row as Record<string, unknown>)));
}
