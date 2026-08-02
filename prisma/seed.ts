import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Colors are the validated categorical palette (8 slots, CVD-safe, fixed order).
// Categories reuse slots in order; beyond 8, later categories fold into slot 8 ("Other"-adjacent).
const PALETTE = [
  "#2a78d6", // 1 blue
  "#eb6834", // 2 orange
  "#1baf7a", // 3 aqua
  "#eda100", // 4 yellow
  "#e87ba4", // 5 magenta
  "#008300", // 6 green
  "#4a3aa7", // 7 violet
  "#e34948", // 8 red
];

const categories = [
  { name: "Salary", icon: "Banknote", color: PALETTE[5], type: "INCOME" as const },
  { name: "Freelance", icon: "Laptop", color: PALETTE[2], type: "INCOME" as const },
  { name: "Other Income", icon: "PiggyBank", color: PALETTE[0], type: "INCOME" as const },

  // Needs — essential, hard to avoid
  { name: "Gas", icon: "Fuel", color: PALETTE[1], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Food", icon: "UtensilsCrossed", color: PALETTE[7], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Groceries", icon: "ShoppingCart", color: PALETTE[3], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Rent", icon: "Home", color: PALETTE[0], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Utilities", icon: "Zap", color: PALETTE[3], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Health", icon: "HeartPulse", color: PALETTE[2], type: "EXPENSE" as const, group: "NEEDS" as const },
  { name: "Subscriptions", icon: "Repeat", color: PALETTE[6], type: "EXPENSE" as const, group: "NEEDS" as const },

  // Wants — discretionary
  { name: "Dates", icon: "Heart", color: PALETTE[4], type: "EXPENSE" as const, group: "WANTS" as const },
  { name: "Shopping", icon: "ShoppingBag", color: PALETTE[4], type: "EXPENSE" as const, group: "WANTS" as const },
  { name: "Entertainment", icon: "Clapperboard", color: PALETTE[6], type: "EXPENSE" as const, group: "WANTS" as const },
  { name: "Other", icon: "Wallet", color: PALETTE[7], type: "EXPENSE" as const, group: "WANTS" as const },

  // Savings — paying your future self
  { name: "Savings", icon: "PiggyBank", color: PALETTE[0], type: "EXPENSE" as const, group: "SAVINGS" as const },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { group: "group" in category ? category.group : null },
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
