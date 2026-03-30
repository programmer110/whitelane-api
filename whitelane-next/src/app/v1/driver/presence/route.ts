import { z } from 'zod';
import { requireDriver } from '@/lib/guard';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export const runtime = 'nodejs';

const bodySchema = z.object({
  is_online: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function PATCH(request: Request) {
  const userOrRes = await requireDriver(request);
  if (userOrRes instanceof Response) return userOrRes;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ message: 'Validation failed', errors: {} }, { status: 422 });
  }

  const patch: Record<string, unknown> = {
    is_online: body.is_online,
    updated_at: new Date().toISOString(),
  };
  if (body.lat !== undefined) patch.last_lat = body.lat;
  if (body.lng !== undefined) patch.last_lng = body.lng;

  const supabase = createSupabaseRouteClient();
  const { error } = await supabase.from('users').update(patch).eq('id', userOrRes.id.toString());
  if (error) throw error;

  return new Response(null, { status: 204 });
}
