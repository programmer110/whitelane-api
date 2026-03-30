import { rowToTrip } from '@/lib/db/mappers';
import { requireDriver } from '@/lib/guard';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { driverTripJson } from '@/lib/trip-resource';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '20', 10) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseRouteClient();
  const { data: rows, error } = await supabase
    .from('trips')
    .select('*')
    .eq('driver_id', userOrRes.id.toString())
    .eq('payment_paid', true)
    .eq('driver_status', 'completed')
    .order('scheduled_at', { ascending: false })
    .range(from, to);
  if (error) throw error;

  const trips = (rows ?? []).map((r) => rowToTrip(r as Record<string, unknown>));
  return Response.json(trips.map(driverTripJson));
}
