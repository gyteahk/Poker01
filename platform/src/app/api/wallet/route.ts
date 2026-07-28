import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    const entries = await prisma.ledgerEntry.findMany({
      where: { wallet: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return jsonOk({
      available: fromMicros(wallet?.availableMicros ?? 0n),
      locked: fromMicros(wallet?.lockedMicros ?? 0n),
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: fromMicros(e.amountMicros),
        balanceAfter: fromMicros(e.balanceAfterMicros),
        lockedAfter: fromMicros(e.lockedAfterMicros),
        note: e.note,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
