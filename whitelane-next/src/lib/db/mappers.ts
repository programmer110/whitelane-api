import type { PersonalAccessTokenRow, RefreshTokenRow, Trip, User } from './types';

function parseBigint(v: unknown): bigint {
  if (typeof v === 'bigint') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === 'string' && v !== '') return BigInt(v);
  throw new TypeError(`Expected bigint-coercible value, got ${typeof v}`);
}

function parseDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v);
  throw new TypeError(`Expected date, got ${typeof v}`);
}

function optDate(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  return parseDate(v);
}

function optStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function decStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

/** Map PostgREST row (snake_case) → User */
export function rowToUser(row: Record<string, unknown>): User {
  return {
    id: parseBigint(row.id),
    name: String(row.name),
    email: String(row.email),
    emailVerifiedAt: optDate(row.email_verified_at),
    password: String(row.password),
    rememberToken: optStr(row.remember_token),
    phone: optStr(row.phone),
    username: optStr(row.username),
    role: String(row.role ?? 'driver'),
    mustResetPassword: Boolean(row.must_reset_password),
    isOnline: Boolean(row.is_online),
    lastLat: decStr(row.last_lat),
    lastLng: decStr(row.last_lng),
    accountStatus: String(row.account_status ?? 'active'),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

export function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: parseBigint(row.id),
    pickupAddress: String(row.pickup_address),
    dropoffAddress: String(row.dropoff_address),
    scheduledAt: parseDate(row.scheduled_at),
    customerDisplayName: String(row.customer_display_name),
    vehicleTypeLabel: String(row.vehicle_type_label ?? 'Standard'),
    segment: String(row.segment ?? 'b2c'),
    driverStatus: String(row.driver_status ?? 'offered'),
    paymentPaid: Boolean(row.payment_paid),
    driverId: row.driver_id == null ? null : parseBigint(row.driver_id),
    pickupLat: decStr(row.pickup_lat),
    pickupLng: decStr(row.pickup_lng),
    dropoffLat: decStr(row.dropoff_lat),
    dropoffLng: decStr(row.dropoff_lng),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

export function rowToPat(row: Record<string, unknown>): PersonalAccessTokenRow {
  return {
    id: parseBigint(row.id),
    tokenableType: String(row.tokenable_type),
    tokenableId: parseBigint(row.tokenable_id),
    name: String(row.name),
    token: String(row.token),
    abilities: row.abilities,
    lastUsedAt: optDate(row.last_used_at),
    expiresAt: optDate(row.expires_at),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

export function rowToRefreshToken(row: Record<string, unknown>): RefreshTokenRow {
  return {
    id: parseBigint(row.id),
    userId: parseBigint(row.user_id),
    tokenHash: String(row.token_hash),
    expiresAt: parseDate(row.expires_at),
    createdAt: parseDate(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}
