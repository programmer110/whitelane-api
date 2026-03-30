import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function dec(n: number) {
  return new Prisma.Decimal(n);
}

async function main() {
  const passwordHash = bcrypt.hashSync('password', 12);

  const driver = await prisma.user.upsert({
    where: { email: 'driver@whitelane.local' },
    update: {
      name: 'Demo Driver',
      username: 'driver1',
      phone: '+10000000001',
      role: 'driver',
      mustResetPassword: false,
      accountStatus: 'active',
      password: passwordHash,
    },
    create: {
      name: 'Demo Driver',
      email: 'driver@whitelane.local',
      username: 'driver1',
      phone: '+10000000001',
      role: 'driver',
      mustResetPassword: false,
      accountStatus: 'active',
      password: passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@whitelane.local' },
    update: {
      name: 'Admin',
      role: 'admin',
      username: 'admin1',
      password: passwordHash,
      accountStatus: 'active',
    },
    create: {
      name: 'Admin',
      email: 'admin@whitelane.local',
      role: 'admin',
      username: 'admin1',
      password: passwordHash,
      accountStatus: 'active',
    },
  });

  await prisma.trip.deleteMany({ where: { driverId: driver.id } });

  const in2h = new Date(Date.now() + 2 * 3600 * 1000);
  const in1d = new Date(Date.now() + 24 * 3600 * 1000);

  await prisma.trip.createMany({
    data: [
      {
        pickupAddress: 'King Fahd Rd, Riyadh',
        dropoffAddress: 'Olaya St, Riyadh',
        scheduledAt: in2h,
        customerDisplayName: 'Customer A',
        vehicleTypeLabel: 'Sedan',
        segment: 'b2c',
        driverStatus: 'offered',
        paymentPaid: true,
        driverId: driver.id,
        pickupLat: dec(24.7136),
        pickupLng: dec(46.6753),
        dropoffLat: dec(24.75),
        dropoffLng: dec(46.7),
      },
      {
        pickupAddress: 'Airport T1',
        dropoffAddress: 'Business District',
        scheduledAt: in1d,
        customerDisplayName: 'Customer B',
        vehicleTypeLabel: 'SUV',
        segment: 'b2b',
        driverStatus: 'assigned',
        paymentPaid: true,
        driverId: driver.id,
        pickupLat: dec(24.96),
        pickupLng: dec(46.6989),
        dropoffLat: dec(24.72),
        dropoffLng: dec(46.68),
      },
    ],
  });

  console.log('Seeded: demo driver (driver1 / password), admin, 2 trips.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
