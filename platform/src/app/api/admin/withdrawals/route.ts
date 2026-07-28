import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { payoutWithdrawal, releaseWithdrawal } from "@/lib/ledger";
import { fromMicros } from "@/lib/money";
import { fakeTxHash } from "@/lib/providers/usdt-gateway";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import type { WithdrawStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const statusParam = req.nextUrl.searchParams.get("status");
    const pendingOnly = statusParam === "PENDING" || !statusParam;
    // default: pending for approve UI; status=ALL for full list
    const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 50), 200);

    const where =
      statusParam === "ALL"
        ? undefined
        : statusParam
          ? { status: statusParam as WithdrawStatus }
          : { status: "PENDING" as const };

    const rows = await prisma.withdrawal.findMany({
      where,
      orderBy: { createdAt: pendingOnly && statusParam !== "ALL" ? "asc" : "desc" },
      take,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
    });

    const mapped = rows.map((w) => ({
      id: w.id,
      amount: fromMicros(w.amountMicros),
      status: w.status,
      toAddress: w.toAddress,
      paidTxHash: w.paidTxHash,
      reviewNote: w.reviewNote,
      reviewedAt: w.reviewedAt,
      createdAt: w.createdAt,
      user: w.user,
    }));

    return jsonOk({
      pending: mapped.filter((w) => w.status === "PENDING"),
      withdrawals: mapped,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

const actionSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = actionSchema.parse(await req.json());

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.findUnique({ where: { id: body.withdrawalId } });
      if (!w) throw new Error("Withdrawal not found");
      if (w.status !== "PENDING") throw new Error("Not pending");

      if (body.action === "reject") {
        await releaseWithdrawal({
          userId: w.userId,
          amountMicros: w.amountMicros,
          withdrawalId: w.id,
          reason: body.note || "Rejected by admin",
          tx,
        });
        return tx.withdrawal.update({
          where: { id: w.id },
          data: {
            status: "REJECTED",
            reviewedBy: admin.id,
            reviewedAt: new Date(),
            reviewNote: body.note || "Rejected",
          },
        });
      }

      const txHash = fakeTxHash();
      await payoutWithdrawal({
        userId: w.userId,
        amountMicros: w.amountMicros,
        withdrawalId: w.id,
        txHash,
        tx,
      });
      return tx.withdrawal.update({
        where: { id: w.id },
        data: {
          status: "PAID",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          reviewNote: body.note || "Approved",
          paidTxHash: txHash,
        },
      });
    });

    return jsonOk({
      id: result.id,
      status: result.status,
      paidTxHash: result.paidTxHash,
      amount: fromMicros(result.amountMicros),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Withdrawal not found") {
      return jsonError(err.message, 404);
    }
    return handleRouteError(err);
  }
}
