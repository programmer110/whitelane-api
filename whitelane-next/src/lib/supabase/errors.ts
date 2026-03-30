function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Shape thrown by @supabase/supabase-js on PostgREST failures (not an Error instance). */
export type PostgrestLikeError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function normalizePostgrestError(e: unknown): PostgrestLikeError | null {
  if (!isRecord(e)) return null;
  const message = e.message;
  if (typeof message !== 'string' || !message.trim()) return null;
  const out: PostgrestLikeError = { message };
  if (typeof e.code === 'string' && e.code) out.code = e.code;
  if (typeof e.details === 'string' && e.details) out.details = e.details;
  if (typeof e.hint === 'string' && e.hint) out.hint = e.hint;
  return out;
}

/** Safe string for logs and generic hints. */
export function formatUnknownError(e: unknown): string {
  const pg = normalizePostgrestError(e);
  if (pg) {
    return [pg.code, pg.message, pg.details, pg.hint].filter(Boolean).join(' | ');
  }
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
