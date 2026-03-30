import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserFromBearer } from '@/lib/auth-tokens';
import { createSupabaseRouteClient } from '@/lib/supabase/route';

export const runtime = 'nodejs';

const bodySchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(255),
});

export async function POST(request: Request) {
  const user = await findUserFromBearer(request.headers.get('authorization'));
  if (!user) {
    return Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json(
      {
        message: 'The current password field is incorrect.',
        errors: { current_password: ['The current password field is incorrect.'] },
      },
      { status: 422 },
    );
  }

  if (!(await bcrypt.compare(body.current_password, user.password))) {
    return Response.json(
      {
        message: 'The current password field is incorrect.',
        errors: { current_password: ['The current password field is incorrect.'] },
      },
      { status: 422 },
    );
  }

  const hash = await bcrypt.hash(body.new_password, 12);
  const supabase = createSupabaseRouteClient();
  const { error } = await supabase
    .from('users')
    .update({
      password: hash,
      must_reset_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id.toString());
  if (error) throw error;

  return new Response(null, { status: 204 });
}
