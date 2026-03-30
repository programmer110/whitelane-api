/** Parse path/query segment as bigint id (PostgreSQL bigserial). */
export function parseBigIntId(param: string): bigint | null {
  try {
    return BigInt(param);
  } catch {
    return null;
  }
}
