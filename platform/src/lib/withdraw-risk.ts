import { prisma } from "./db";
import { AUTO_WITHDRAW_LIMIT_MICROS } from "./money";

export type WithdrawRiskResult = {
  auto: boolean;
  reasons: string[];
};

const MIN_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;
const RECENT_DEPOSIT_WINDOW_MS = 30 * 60 * 1000;
const MAX_AUTO_PER_DAY = 5;
const MAX_AUTO_MICROS_PER_DAY = 3000n * 1_000_000n;

/**
 * MVP 自動出款風控：全部通過才可 auto。
 * 失敗則維持 PENDING 等人手。
 */
export async function evaluateWithdrawAuto(params: {
  userId: string;
  amountMicros: bigint;
  toAddress: string;
}): Promise<WithdrawRiskResult> {
  const reasons: string[] = [];

  if (params.amountMicros > AUTO_WITHDRAW_LIMIT_MICROS) {
    reasons.push("超過自動出款上限 1000 USDT");
  }

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) {
    reasons.push("用戶不存在");
    return { auto: false, reasons };
  }

  if (Date.now() - user.createdAt.getTime() < MIN_ACCOUNT_AGE_MS) {
    reasons.push("帳戶未滿 24 小時");
  }

  const priorPaid = await prisma.withdrawal.count({
    where: { userId: params.userId, status: "PAID" },
  });
  if (priorPaid === 0) {
    reasons.push("首筆提現需人手審核");
  }

  const recentDeposit = await prisma.deposit.findFirst({
    where: {
      userId: params.userId,
      status: "CONFIRMED",
      confirmedAt: { gte: new Date(Date.now() - RECENT_DEPOSIT_WINDOW_MS) },
    },
    orderBy: { confirmedAt: "desc" },
  });
  if (recentDeposit) {
    reasons.push("近 30 分鐘有入金，需人手審核");
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todaysAuto = await prisma.withdrawal.findMany({
    where: {
      userId: params.userId,
      status: "PAID",
      reviewedAt: { gte: dayStart },
      reviewNote: { contains: "auto" },
    },
  });
  if (todaysAuto.length >= MAX_AUTO_PER_DAY) {
    reasons.push("今日自動出款次數已達上限");
  }
  const todaysAutoSum = todaysAuto.reduce((s, w) => s + w.amountMicros, 0n);
  if (todaysAutoSum + params.amountMicros > MAX_AUTO_MICROS_PER_DAY) {
    reasons.push("今日自動出款額度不足");
  }

  // Soft address check: if user has paid before, prefer same address for auto
  if (priorPaid > 0) {
    const lastPaid = await prisma.withdrawal.findFirst({
      where: { userId: params.userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });
    if (lastPaid && lastPaid.toAddress !== params.toAddress) {
      reasons.push("提現地址與上次不同，需人手審核");
    }
  }

  return { auto: reasons.length === 0, reasons };
}
