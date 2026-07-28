import { randomBytes } from "crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDepositOrder, isNowPaymentsConfigured } from "@/lib/providers/usdt-gateway";
import { fromMicros } from "@/lib/money";
import { handleRouteError, jsonOk } from "@/lib/api";

const schema = z.object({
  // Optional quote in USDT-TRC20. Empty → DEFAULT_DEPOSIT_QUOTE_USDT
  // NOWPayments min usdttrc20↔usdttrc20 is ~11
  amountUsdt: z.number().min(15).max(100000).optional(),
});

function quoteAmount(requested?: number): number {
  if (requested !== undefined) return requested;
  const raw = Number(process.env.DEFAULT_DEPOSIT_QUOTE_USDT || 1000);
  return Number.isFinite(raw) && raw >= 15 ? raw : 1000;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const amountUsdt = quoteAmount(body.amountUsdt);
    const orderId = randomBytes(12).toString("hex");
    const order = await createDepositOrder({
      userId: user.id,
      amountUsdt,
      orderId,
    });

    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        amountMicros: order.amountMicros,
        payAddress: order.payAddress,
        gatewayOrderId: order.gatewayOrderId,
        expiresAt: order.expiresAt,
        chain: order.chain,
        asset: order.asset,
      },
    });

    const simulate =
      process.env.ALLOW_DEPOSIT_SIMULATE === "true" &&
      (!isNowPaymentsConfigured() || !process.env.USDT_GATEWAY_CALLBACK_URL);

    return jsonOk({
      depositId: deposit.id,
      gatewayOrderId: deposit.gatewayOrderId,
      payAddress: deposit.payAddress,
      amount: fromMicros(deposit.amountMicros),
      payAmount: order.payAmountUsdt,
      chain: deposit.chain,
      asset: deposit.asset,
      expiresAt: deposit.expiresAt,
      provider: order.provider,
      canSimulate: simulate,
      amountOptional: true,
      note:
        order.provider === "nowpayments"
          ? "轉幾多入幾多（按實際到帳）。金額欄可留空。"
          : "Stub 模式",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const deposits = await prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return jsonOk({
      deposits: deposits.map((d) => ({
        id: d.id,
        amount: fromMicros(d.amountMicros),
        status: d.status,
        payAddress: d.payAddress,
        txHash: d.txHash,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
