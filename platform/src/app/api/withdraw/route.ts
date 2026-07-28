import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lockWithdrawal, payoutWithdrawal } from "@/lib/ledger";
import { toMicros, fromMicros, AUTO_WITHDRAW_LIMIT_MICROS } from "@/lib/money";
import { evaluateWithdrawAuto } from "@/lib/withdraw-risk";
import { fakeTxHash } from "@/lib/providers/usdt-gateway";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  amountUsdt: z.number().min(10).max(100000),
  toAddress: z.string().min(20).max(64),
});

/**
 * 提現：先鎖額。
 * ≤1000 且通過風控 → stub 自動出款 PAID；否則 PENDING 等人手。
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const amountMicros = toMicros(body.amountUsdt);
    const toAddress = body.toAddress.trim();

    if (!toAddress.startsWith("T") || toAddress.length < 30) {
      return jsonError("Invalid TRC20 address (must start with T)", 400);
    }

    const risk = await evaluateWithdrawAuto({
      userId: user.id,
      amountMicros,
      toAddress,
    });

    const result = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amountMicros,
          toAddress,
          status: "PENDING",
        },
      });
      await lockWithdrawal({
        userId: user.id,
        amountMicros,
        withdrawalId: w.id,
        tx,
      });

      if (!risk.auto) {
        return {
          withdrawal: w,
          mode: "manual" as const,
        };
      }

      const txHash = fakeTxHash();
      await payoutWithdrawal({
        userId: user.id,
        amountMicros,
        withdrawalId: w.id,
        txHash,
        tx,
      });
      const paid = await tx.withdrawal.update({
        where: { id: w.id },
        data: {
          status: "PAID",
          reviewedBy: "system-auto",
          reviewedAt: new Date(),
          reviewNote: "auto:≤1000+risk-pass",
          paidTxHash: txHash,
        },
      });
      return { withdrawal: paid, mode: "auto" as const, txHash };
    });

    return jsonOk({
      withdrawalId: result.withdrawal.id,
      amount: fromMicros(result.withdrawal.amountMicros),
      status: result.withdrawal.status,
      reviewMode: result.mode,
      autoLimitUsdt: fromMicros(AUTO_WITHDRAW_LIMIT_MICROS),
      riskReasons: risk.auto ? [] : risk.reasons,
      paidTxHash: result.mode === "auto" ? result.txHash : null,
      note:
        result.mode === "auto"
          ? "已自動出款（stub tx；接真 gateway 後改為真實鏈上轉帳）"
          : `已提交人手審核：${risk.reasons.join("；")}`,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return jsonOk({
      withdrawals: rows.map((w) => ({
        id: w.id,
        amount: fromMicros(w.amountMicros),
        status: w.status,
        toAddress: w.toAddress,
        createdAt: w.createdAt,
        reviewNote: w.reviewNote,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
