import type { User } from '@/lib/db/types';
import { findUserFromBearer } from './auth-tokens';
import { jsonError } from './http';

export async function requireAuth(request: Request): Promise<User | Response> {
  const user = await findUserFromBearer(request.headers.get('authorization'));
  if (!user) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }
  return user;
}

export async function requireDriver(request: Request): Promise<User | Response> {
  const u = await requireAuth(request);
  if (u instanceof Response) return u;
  if (u.role !== 'driver' || u.accountStatus !== 'active') {
    return jsonError('forbidden', 'Driver access only.', 403);
  }
  return u;
}
