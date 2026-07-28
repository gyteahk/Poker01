import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const g = await p.gameCatalog.findMany({
  select: { name: true, imageUrl: true, externalId: true },
});
console.log(JSON.stringify(g, null, 2));
await p.$disconnect();
