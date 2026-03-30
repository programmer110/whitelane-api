import { z } from 'zod';
import { issuePair } from '@/lib/auth-tokens';
import { json, jsonError } from '@/lib/http';
import { resolveUser, verifySecret } from '@/lib/login';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  } catch (e) {
    if (e instanceof z.ZodError) {
      return json({ message: 'Validation failed', errors: e.flatten().fieldErrors }, 422);
    }
    return json(
      {
        message: 'Validation failed',
        errors: {},
        hint: 'Send JSON with Content-Type: application/json',
      },
      422,
    );
  }

  try {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('NEXT_PUBLIC_SUPABASE')) {
      return json(
        {
          error: {
            code: 'configuration',
            message: 'Supabase env vars are not set on the server.',
          },
          hint: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in Vercel → Settings → Environment Variables.',
        },
        503,
      );
    }
    console.error('[driver/login]', e);
    return json(
      {
        error: {
          code: 'upstream',
          message: 'Database request failed.',
        },
        hint: msg,
      },
      503,
    );
  }
}
