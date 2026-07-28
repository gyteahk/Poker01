/** USDT amounts stored as integer micros: 1 USDT = 1_000_000 micros */

export const USDT_MICROS = 1_000_000n;
export const AUTO_WITHDRAW_LIMIT_MICROS = 1000n * USDT_MICROS;

export function toMicros(usdt: number | string): bigint {
  const n = typeof usdt === "string" ? Number(usdt) : usdt;
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid amount");
  }
  return BigInt(Math.round(n * 1_000_000));
}

export function fromMicros(micros: bigint): string {
  const neg = micros < 0n;
  const abs = neg ? -micros : micros;
  const whole = abs / USDT_MICROS;
  const frac = (abs % USDT_MICROS).toString().padStart(6, "0");
  const trimmed = frac.replace(/0+$/, "") || "0";
  const s = trimmed === "0" ? whole.toString() : `${whole}.${trimmed}`;
  return neg ? `-${s}` : s;
}

export function formatUsdt(micros: bigint): string {
  return `${fromMicros(micros)} USDT`;
}
