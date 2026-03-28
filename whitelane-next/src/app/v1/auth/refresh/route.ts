import { z } from 'zod';
import { refreshWithPlain } from '@/lib/auth-tokens';
import { json, jsonError } from '@/lib/http';

export const runtime = 'nodejs';

const bodySchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return json({ message: 'Validation failed', errors: {} }, 422);
  }

  const pair = await refreshWithPlain(body.refresh_token);
  if (!pair) {
    return jsonError('invalid_token', 'Invalid or expired refresh token', 401);
  }

  return json({
    access_token: pair.access_token,
    refresh_token: pair.refresh_token,
    expires_in: pair.expires_in,
  });
}
