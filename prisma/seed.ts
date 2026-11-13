import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const OTHERS_GAME_SLUG = "others";

const DESIRED_GAMES: Array<[string, string]> = [
  ["Sim Racing", "sim-racing"],
  ["Game of Generals", "game-of-generals"],
  ["Others", OTHERS_GAME_SLUG],
];

function sslOption(connectionString: string) {
  if (!/[?&]sslmode=/i.test(connectionString) && !/rds\.amazonaws\.com/i.test(connectionString)) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    ssl: sslOption(connectionString),
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.game.updateMany({ data: { active: false } });

    for (const [name, slug] of DESIRED_GAMES) {
      await prisma.game.upsert({
        where: { slug },
        create: { name, slug, active: true },
        update: { name, active: true },
      });
    }

    const encoderCount = await prisma.encoder.count();
    if (encoderCount === 0) {
      const passwordHash = await bcrypt.hash("encoder123", 10);
      await prisma.encoder.create({
        data: {
          username: "encoder",
          passwordHash,
          displayName: "Lead Encoder",
        },
      });
    }

    console.log("Seed complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
