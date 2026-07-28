import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";
import type { DepositStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const status = req.nextUrl.searchParams.get("status") as DepositStatus | null;
    const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);

    const rows = await prisma.deposit.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });

    return jsonOk({
      deposits: rows.map((d) => ({
        id: d.id,
        amount: fromMicros(d.amountMicros),
        status: d.status,
        chain: d.chain,
        payAddress: d.payAddress,
        gatewayOrderId: d.gatewayOrderId,
        txHash: d.txHash,
        confirmedAt: d.confirmedAt,
        expiresAt: d.expiresAt,
        createdAt: d.createdAt,
        user: d.user,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
