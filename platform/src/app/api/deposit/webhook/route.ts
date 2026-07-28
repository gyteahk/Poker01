import { prisma } from "@/lib/db";
import { creditDeposit } from "@/lib/ledger";
import { toMicros, fromMicros } from "@/lib/money";
import {
  isCreditablePaymentStatus,
  verifyNowPaymentsIpn,
} from "@/lib/providers/usdt-gateway";
import { safeEqual } from "@/lib/auth";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

const simulateSchema = z.object({
  gatewayOrderId: z.string().min(1),
  txHash: z.string().min(10),
  amountUsdt: z.number().positive(),
  status: z.literal("confirmed"),
});

const MIN_CREDIT_USDT = 0.01;

/**
 * NOWPayments IPN + local simulate.
 * Credit rule: 實際到帳幾多就入幾多（actually_paid），唔強制對齊下單額。
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const sig = req.headers.get("x-nowpayments-sig") || "";
    const simSecret = req.headers.get("x-gateway-secret") || "";

    if (simSecret) {
      if (process.env.ALLOW_DEPOSIT_SIMULATE !== "true") {
        return jsonError("Simulate disabled", 403);
      }
      const expected = process.env.USDT_GATEWAY_WEBHOOK_SECRET || "";
      if (!expected || !safeEqual(simSecret, expected)) {
        return jsonError("Invalid webhook secret", 401);
      }
      const body = simulateSchema.parse(JSON.parse(raw || "{}"));
      return creditConfirmed({
        gatewayOrderId: body.gatewayOrderId,
        txHash: body.txHash,
        paidUsdt: body.amountUsdt,
      });
    }

    if (!sig) return jsonError("Missing signature", 401);
    const payload = JSON.parse(raw || "{}") as Record<string, unknown>;
    if (!verifyNowPaymentsIpn(payload, sig)) {
      return jsonError("Invalid IPN signature", 401);
    }

    const paymentStatus = String(payload.payment_status || "");
    const paymentId = String(payload.payment_id || "");
    if (!paymentId) return jsonError("Missing payment_id", 400);

    if (!isCreditablePaymentStatus(paymentStatus)) {
      return jsonOk({ ok: true, ignored: true, paymentStatus });
    }

    const deposit = await prisma.deposit.findUnique({
      where: { gatewayOrderId: paymentId },
    });
    if (!deposit) return jsonError("Order not found", 404);

    const paidUsdt = Number(payload.actually_paid ?? 0);
    if (!Number.isFinite(paidUsdt) || paidUsdt < MIN_CREDIT_USDT) {
      return jsonOk({ ok: true, ignored: true, reason: "no_actual_payment" });
    }

    const hashCandidate =
      typeof payload.payin_hash === "string"
        ? payload.payin_hash
        : typeof payload.outcome_hash === "string"
          ? payload.outcome_hash
          : "";
    const txHash = hashCandidate || `nowp_${paymentId}_${paidUsdt}`;

    return creditConfirmed({
      gatewayOrderId: deposit.gatewayOrderId,
      txHash,
      paidUsdt,
      paymentStatus,
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

async function creditConfirmed(params: {
  gatewayOrderId: string;
  txHash: string;
  paidUsdt: number;
  paymentStatus?: string;
}) {
  const deposit = await prisma.deposit.findUnique({
    where: { gatewayOrderId: params.gatewayOrderId },
  });
  if (!deposit) return jsonError("Order not found", 404);
  if (deposit.status === "CONFIRMED") {
    return jsonOk({ ok: true, duplicate: true });
  }
  if (deposit.expiresAt < new Date()) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { status: "EXPIRED" },
    });
    return jsonError("Deposit expired", 400);
  }

  if (params.paidUsdt < MIN_CREDIT_USDT) {
    return jsonError("Paid amount too small", 400);
  }

  // 轉到幾多就充幾多
  const amountMicros = toMicros(params.paidUsdt);

  await prisma.$transaction(async (tx) => {
    await creditDeposit({
      userId: deposit.userId,
      amountMicros,
      depositId: deposit.id,
      txHash: params.txHash,
      tx,
    });
    await tx.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "CONFIRMED",
        amountMicros,
        txHash: params.txHash,
        confirmedAt: new Date(),
      },
    });
  });

  return jsonOk({
    ok: true,
    credited: fromMicros(amountMicros),
    paymentStatus: params.paymentStatus || null,
  });
}
