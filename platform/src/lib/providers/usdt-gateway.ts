import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { toMicros } from "../money";

/**
 * USDT-TRC20 via NOWPayments.
 * Docs: https://documenter.getpostman.com/view/7907941/2s93JusNJt
 */

export type CreateDepositOrderInput = {
  userId: string;
  amountUsdt: number;
  orderId: string;
};

export type CreateDepositOrderResult = {
  gatewayOrderId: string;
  payAddress: string;
  amountMicros: bigint;
  /** Amount user should send on-chain (may match amountMicros) */
  payAmountUsdt: string;
  expiresAt: Date;
  chain: "TRC20";
  asset: "USDT";
  provider: "nowpayments" | "stub";
  paymentStatus?: string;
};

function apiBase(): string {
  return (process.env.NOWPAYMENTS_API_BASE || "https://api.nowpayments.io/v1").replace(/\/$/, "");
}

function apiKey(): string | undefined {
  return process.env.NOWPAYMENTS_API_KEY || undefined;
}

function callbackUrl(): string | undefined {
  const u = process.env.USDT_GATEWAY_CALLBACK_URL?.trim();
  return u || undefined;
}

export function isNowPaymentsConfigured(): boolean {
  return Boolean(apiKey() && process.env.NOWPAYMENTS_IPN_SECRET);
}

export async function createDepositOrder(
  input: CreateDepositOrderInput
): Promise<CreateDepositOrderResult> {
  const key = apiKey();
  if (!key) {
    return createStubOrder(input);
  }

  const body: Record<string, unknown> = {
    // Pure USDT-TRC20 (no fiat/FX) → aim for 0.5% "without exchange" tier
    price_amount: input.amountUsdt,
    price_currency: "usdttrc20",
    pay_currency: "usdttrc20",
    order_id: input.orderId,
    order_description: `cyber888 deposit ${input.userId.slice(0, 8)}`,
    is_fixed_rate: false,
    is_fee_paid_by_user: false,
  };
  const cb = callbackUrl();
  if (cb) body.ipn_callback_url = cb;

  const res = await fetch(`${apiBase()}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : `NOWPayments error ${res.status}`;
    throw new Error(msg);
  }

  const paymentId = String(data.payment_id ?? "");
  const payAddress = String(data.pay_address ?? "");
  const payAmount = Number(data.pay_amount ?? input.amountUsdt);
  if (!paymentId || !payAddress) {
    throw new Error("NOWPayments response missing payment_id/pay_address");
  }

  const expiresAt = data.expiration_estimate_date
    ? new Date(String(data.expiration_estimate_date))
    : new Date(Date.now() + 30 * 60 * 1000);

  return {
    gatewayOrderId: paymentId,
    payAddress,
    amountMicros: toMicros(input.amountUsdt),
    payAmountUsdt: String(payAmount),
    expiresAt,
    chain: "TRC20",
    asset: "USDT",
    provider: "nowpayments",
    paymentStatus: data.payment_status ? String(data.payment_status) : "waiting",
  };
}

function createStubOrder(input: CreateDepositOrderInput): CreateDepositOrderResult {
  const suffix = Buffer.from(input.orderId).toString("hex").slice(0, 24).padEnd(24, "0");
  const payAddress = `T${suffix}DEMOUSDTTRC20`.slice(0, 34);
  return {
    gatewayOrderId: `gw_${input.orderId}`,
    payAddress,
    amountMicros: toMicros(input.amountUsdt),
    payAmountUsdt: String(input.amountUsdt),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    chain: "TRC20",
    asset: "USDT",
    provider: "stub",
  };
}

/** NOWPayments IPN: HMAC-SHA512 over JSON with sorted keys */
export function verifyNowPaymentsIpn(payload: Record<string, unknown>, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET || "";
  if (!secret || !signature) return false;
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  const hmac = createHmac("sha512", secret).update(sorted).digest("hex");
  try {
    const a = Buffer.from(hmac, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isCreditablePaymentStatus(status: string): boolean {
  const s = status.toLowerCase();
  // finished/confirmed = full; partially_paid = credit whatever arrived
  return s === "finished" || s === "confirmed" || s === "partially_paid";
}

/** @deprecated use isCreditablePaymentStatus */
export function isFinishedPaymentStatus(status: string): boolean {
  return isCreditablePaymentStatus(status);
}

export function fakeTxHash(): string {
  return `0x${randomBytes(32).toString("hex")}`;
}
