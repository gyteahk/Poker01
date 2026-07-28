import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
    const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q } },
              { displayName: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
        wallet: {
          select: { availableMicros: true, lockedMicros: true },
        },
        _count: {
          select: { deposits: true, withdrawals: true, bets: true },
        },
      },
    });

    return jsonOk({
      members: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt,
        available: fromMicros(u.wallet?.availableMicros ?? 0n),
        locked: fromMicros(u.wallet?.lockedMicros ?? 0n),
        deposits: u._count.deposits,
        withdrawals: u._count.withdrawals,
        bets: u._count.bets,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
