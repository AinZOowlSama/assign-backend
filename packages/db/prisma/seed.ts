import { PrismaClient, Role, RecordType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(" Seeding database...");

  // ─── Seed Users ─────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@finance.dev" },
    update: {},
    create: {
      email: "admin@finance.dev",
      name: "Admin User",
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@finance.dev" },
    update: {},
    create: {
      email: "analyst@finance.dev",
      name: "Analyst User",
      password: hashedPassword,
      role: Role.ANALYST,
    },
  });

  await prisma.user.upsert({
    where: { email: "viewer@finance.dev" },
    update: {},
    create: {
      email: "viewer@finance.dev",
      name: "Viewer User",
      password: hashedPassword,
      role: Role.VIEWER,
    },
  });

  // ─── Seed Financial Records ──────────────────────────────────────────────────
  const records = [
    {
      amount: 85000,
      type: RecordType.INCOME,
      category: "Salary",
      date: new Date("2024-01-01"),
      notes: "January salary",
      createdById: admin.id,
    },
    {
      amount: 12000,
      type: RecordType.EXPENSE,
      category: "Rent",
      date: new Date("2024-01-05"),
      notes: "Monthly rent",
      createdById: admin.id,
    },
    {
      amount: 3500,
      type: RecordType.EXPENSE,
      category: "Groceries",
      date: new Date("2024-01-10"),
      createdById: analyst.id,
    },
    {
      amount: 15000,
      type: RecordType.INCOME,
      category: "Freelance",
      date: new Date("2024-01-15"),
      notes: "Website project",
      createdById: analyst.id,
    },
    {
      amount: 2000,
      type: RecordType.EXPENSE,
      category: "Utilities",
      date: new Date("2024-01-20"),
      createdById: admin.id,
    },
    {
      amount: 85000,
      type: RecordType.INCOME,
      category: "Salary",
      date: new Date("2024-02-01"),
      notes: "February salary",
      createdById: admin.id,
    },
    {
      amount: 12000,
      type: RecordType.EXPENSE,
      category: "Rent",
      date: new Date("2024-02-05"),
      createdById: admin.id,
    },
    {
      amount: 8000,
      type: RecordType.EXPENSE,
      category: "Travel",
      date: new Date("2024-02-14"),
      notes: "Business trip",
      createdById: analyst.id,
    },
  ];

  for (const record of records) {
    await prisma.financialRecord.create({ data: record });
  }

  console.log(" Seeding complete.");
  console.log("\n Test credentials (password: Password123):");
  console.log("   Admin:   admin@finance.dev");
  console.log("   Analyst: analyst@finance.dev");
  console.log("   Viewer:  viewer@finance.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
