import { z } from 'zod';
import { requireDriver } from '@/lib/guard';
import { prisma } from '@/lib/prisma';

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

  await prisma.user.update({
    where: { id: userOrRes.id },
    data: {
      isOnline: body.is_online,
      ...(body.lat !== undefined ? { lastLat: body.lat } : {}),
      ...(body.lng !== undefined ? { lastLng: body.lng } : {}),
    },
  });

  return new Response(null, { status: 204 });
}
