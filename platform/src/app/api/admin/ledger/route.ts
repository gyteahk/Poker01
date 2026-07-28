import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";
import type { LedgerType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const userId = req.nextUrl.searchParams.get("userId") || undefined;
    const type = req.nextUrl.searchParams.get("type") as LedgerType | null;
    const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 80), 300);

    const rows = await prisma.ledgerEntry.findMany({
      where: {
        ...(userId ? { wallet: { userId } } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        wallet: {
          select: {
            user: { select: { id: true, email: true, displayName: true } },
          },
        },
      },
    });

    return jsonOk({
      entries: rows.map((e) => ({
        id: e.id,
        type: e.type,
        amount: fromMicros(e.amountMicros),
        balanceAfter: fromMicros(e.balanceAfterMicros),
        lockedAfter: fromMicros(e.lockedAfterMicros),
        idempotencyKey: e.idempotencyKey,
        refType: e.refType,
        refId: e.refId,
        note: e.note,
        createdAt: e.createdAt,
        user: e.wallet.user,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
