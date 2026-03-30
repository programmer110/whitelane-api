import type { Trip } from '@/lib/db/types';
import { rowToTrip } from '@/lib/db/mappers';
import { createSupabaseRouteClient } from '@/lib/supabase/route';
import { isConfirmedOperational } from './trip-policy';

export async function findAuthorizedTrip(tripId: bigint, driverId: bigint): Promise<Trip | null> {
  const supabase = createSupabaseRouteClient();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId.toString())
    .eq('driver_id', driverId.toString())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const model = rowToTrip(data as Record<string, unknown>);
  if (!isConfirmedOperational(model)) return null;
  return model;
}
