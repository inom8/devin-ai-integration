import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.ADMIN_PHONE || "+998900000000";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: { name: adminName, role: "ADMIN", passwordHash },
    create: {
      phone: adminPhone,
      name: adminName,
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log(`Admin user seeded: ${admin.phone} (${admin.id})`);

  const defaultCategories = [
    "Oil Change",
    "Diagnostics",
    "Maintenance",
    "Tire Repair",
    "Car Wash",
    "Battery Service",
    "Brake Repair",
    "AC Service",
  ];

  for (const name of defaultCategories) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${defaultCategories.length} service categories`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
