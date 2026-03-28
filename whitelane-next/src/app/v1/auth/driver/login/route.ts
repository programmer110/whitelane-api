import { z } from 'zod';
import { issuePair } from '@/lib/auth-tokens';
import { json, jsonError } from '@/lib/http';
import { resolveUser, verifySecret } from '@/lib/login';

export const runtime = 'nodejs';

const bodySchema = z.object({
  identifier: z.string().min(1).max(191),
  secret: z.string().min(1).max(255),
  mode: z.enum(['password', 'otp']),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.json();
    body = bodySchema.parse(raw);
  } catch {
    return json({ message: 'Validation failed', errors: {} }, 422);
  }

  const user = await resolveUser(body.identifier);
  if (!user) {
    return jsonError('not_found', 'Invalid credentials', 404);
  }

  if (user.role !== 'driver' || user.accountStatus !== 'active') {
    return jsonError('forbidden', 'Account not provisioned for driver app', 403);
  }

  if (!(await verifySecret(user, body.secret, body.mode))) {
    return jsonError('not_found', 'Invalid credentials', 404);
  }

  const pair = await issuePair(user);

  return json({
    access_token: pair.access_token,
    refresh_token: pair.refresh_token,
    expires_in: pair.expires_in,
    must_reset_password: user.mustResetPassword,
    user: {
      id: String(user.id),
      display_name: user.name,
      roles: [user.role],
      is_online: user.isOnline,
    },
  });
}
