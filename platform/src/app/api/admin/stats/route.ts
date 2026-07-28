import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const [memberCount, pendingWithdrawals, pendingDeposits, confirmedDeposits, recentBets] =
      await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.withdrawal.count({ where: { status: "PENDING" } }),
        prisma.deposit.count({ where: { status: "PENDING" } }),
        prisma.deposit.aggregate({
          where: { status: "CONFIRMED" },
          _sum: { amountMicros: true },
          _count: true,
        }),
        prisma.bet.count(),
      ]);

    return jsonOk({
      memberCount,
      pendingWithdrawals,
      pendingDeposits,
      confirmedDepositCount: confirmedDeposits._count,
      confirmedDepositTotal: fromMicros(confirmedDeposits._sum.amountMicros ?? 0n),
      betCount: recentBets,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
