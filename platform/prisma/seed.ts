import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@cyber888.win";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123456";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: {
      email,
      passwordHash,
      displayName: "Admin",
      role: "ADMIN",
      wallet: { create: {} },
    },
  });

  const games = [
    { provider: "demo-casino", externalId: "slot-fortune", name: "Fortune Spin", category: "slots", sortOrder: 1, imageUrl: "/games/covers/slot-fortune.png" },
    { provider: "demo-casino", externalId: "slot-neon", name: "Neon Reels", category: "slots", sortOrder: 2, imageUrl: "/games/covers/slot-neon.png" },
    { provider: "demo-casino", externalId: "live-baccarat", name: "Live Baccarat", category: "live", sortOrder: 10, imageUrl: "/games/covers/live-baccarat.png" },
    { provider: "demo-casino", externalId: "live-roulette", name: "Live Roulette", category: "live", sortOrder: 11, imageUrl: "/games/covers/live-roulette.png" },
    { provider: "demo-casino", externalId: "fish-ocean", name: "Ocean King", category: "fishing", sortOrder: 20, imageUrl: "/games/covers/fish-ocean.png" },
    { provider: "demo-casino", externalId: "cards-blackjack", name: "Blackjack", category: "cards", sortOrder: 30, imageUrl: "/games/covers/cards-blackjack.png" },
    { provider: "demo-casino", externalId: "poker-hold", name: "Casino Hold'em", category: "poker", sortOrder: 40, imageUrl: "/games/covers/poker-hold.png" },
  ];

  for (const g of games) {
    await prisma.gameCatalog.upsert({
      where: { provider_externalId: { provider: g.provider, externalId: g.externalId } },
      update: g,
      create: g,
    });
  }

  const kickoff = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const events = [
    {
      provider: "demo-sports",
      externalId: "fb-001",
      sport: "football",
      league: "Premier League",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      startsAt: kickoff,
      oddsJson: JSON.stringify({ home: 2.1, draw: 3.4, away: 3.5 }),
    },
    {
      provider: "demo-sports",
      externalId: "fb-002",
      sport: "football",
      league: "La Liga",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      oddsJson: JSON.stringify({ home: 2.3, draw: 3.3, away: 3.1 }),
    },
    {
      provider: "demo-sports",
      externalId: "fb-003",
      sport: "football",
      league: "Serie A",
      homeTeam: "Inter",
      awayTeam: "Milan",
      startsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
      oddsJson: JSON.stringify({ home: 2.0, draw: 3.2, away: 3.8 }),
    },
  ];

  for (const e of events) {
    await prisma.sportEvent.upsert({
      where: { provider_externalId: { provider: e.provider, externalId: e.externalId } },
      update: e,
      create: e,
    });
  }

  console.log("Seed OK");
  console.log(`Admin: ${admin.email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
