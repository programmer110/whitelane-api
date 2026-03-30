/** Domain types (camelCase) — same shape the app used with Prisma. */

export type User = {
  id: bigint;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  password: string;
  rememberToken: string | null;
  phone: string | null;
  username: string | null;
  role: string;
  mustResetPassword: boolean;
  isOnline: boolean;
  lastLat: string | null;
  lastLng: string | null;
  accountStatus: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Trip = {
  id: bigint;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  customerDisplayName: string;
  vehicleTypeLabel: string;
  segment: string;
  driverStatus: string;
  paymentPaid: boolean;
  driverId: bigint | null;
  pickupLat: string | null;
  pickupLng: string | null;
  dropoffLat: string | null;
  dropoffLng: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PersonalAccessTokenRow = {
  id: bigint;
  tokenableType: string;
  tokenableId: bigint;
  name: string;
  token: string;
  abilities: unknown;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RefreshTokenRow = {
  id: bigint;
  userId: bigint;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
