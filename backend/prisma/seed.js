require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

async function main() {
  console.log('Seeding initial development users...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@kaushalsaathi.com';
  const adminPass = process.env.SEED_ADMIN_PASSWORD;

  const managerEmail = process.env.SEED_MANAGER_EMAIL || 'manager@kaushalsaathi.com';
  const managerPass = process.env.SEED_MANAGER_PASSWORD;

  const counsellorEmail = process.env.SEED_COUNSELLOR_EMAIL || 'counsellor@kaushalsaathi.com';
  const counsellorPass = process.env.SEED_COUNSELLOR_PASSWORD;

  if (!adminPass || !managerPass || !counsellorPass) {
    throw new Error(
      'Missing required seed passwords in environment variables (SEED_ADMIN_PASSWORD, SEED_MANAGER_PASSWORD, SEED_COUNSELLOR_PASSWORD)'
    );
  }

  const passwordHash = await bcrypt.hash(adminPass, 10);
  const managerPasswordHash = await bcrypt.hash(managerPass, 10);
  const counsellorPasswordHash = await bcrypt.hash(counsellorPass, 10);

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      name: 'System Admin',
      email: adminEmail,
      phone: '9999999991',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 2. Manager User
  const manager = await prisma.user.upsert({
    where: { email: managerEmail },
    update: {
      passwordHash: managerPasswordHash,
      isActive: true,
    },
    create: {
      name: 'Sales Manager',
      email: managerEmail,
      phone: '9999999992',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      isActive: true,
    },
  });

  // 3. Counsellor 1 User
  const counsellor = await prisma.user.upsert({
    where: { email: counsellorEmail },
    update: {
      passwordHash: counsellorPasswordHash,
      isActive: true,
    },
    create: {
      name: 'Lead Counsellor One',
      email: counsellorEmail,
      phone: '9999999993',
      passwordHash: counsellorPasswordHash,
      role: 'COUNSELLOR',
      isActive: true,
    },
  });

  // 4. Counsellor 2 User (For reassignment tests)
  const counsellor2 = await prisma.user.upsert({
    where: { email: 'counsellor2@kaushalsaathi.com' },
    update: {
      passwordHash: counsellorPasswordHash,
      isActive: true,
    },
    create: {
      name: 'Lead Counsellor Two',
      email: 'counsellor2@kaushalsaathi.com',
      phone: '9999999994',
      passwordHash: counsellorPasswordHash,
      role: 'COUNSELLOR',
      isActive: true,
    },
  });

  console.log('✔ Seeded test users successfully:');
  console.log('  Admin:', admin.email);
  console.log('  Manager:', manager.email);
  console.log('  Counsellor 1:', counsellor.email);
  console.log('  Counsellor 2:', counsellor2.email);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
