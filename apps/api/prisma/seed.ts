import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@test.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'test123';
  const name = process.env.ADMIN_SEED_NAME || 'Rocky Admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
    },
  });

  console.log(`Seeded admin user: ${admin.email} (id=${admin.id})`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
