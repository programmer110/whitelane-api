import { findUserFromBearer, revokeAll } from '@/lib/auth-tokens';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await findUserFromBearer(request.headers.get('authorization'));
  if (user) {
    await revokeAll(user);
  }
  return new Response(null, { status: 204 });
}
