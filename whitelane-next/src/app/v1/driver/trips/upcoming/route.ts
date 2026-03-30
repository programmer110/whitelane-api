import { rowToTrip } from '@/lib/db/mappers';
import { requireDriver } from '@/lib/guard';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const supabase = createSupabaseRouteClient();
  const { data: rows, error } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', userOrRes.id.toString())
    .eq('payment_paid', true)
    .neq('driver_status', 'completed')
    .neq('driver_status', 'cancelled')
    .order('scheduled_at', { ascending: true });
  if (error) throw error;

  const trips = (rows ?? []).map((r) => rowToTrip(r as Record<string, unknown>));
  return Response.json(trips.map(driverTripJson));
}
