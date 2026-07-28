import { LedgerType, Prisma } from "@prisma/client";
import { prisma } from "./db";

type Tx = Prisma.TransactionClient;

export class LedgerError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function getWalletForUpdate(tx: Tx, userId: string) {
  // SQLite: emulate lock by reading inside transaction
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { userId } });
  }
  return wallet;
}

export async function applyLedgerEntry(params: {
  userId: string;
  type: LedgerType;
  /** Positive = credit available; use lockedDelta for lock movements */
  availableDelta: bigint;
  lockedDelta?: bigint;
  idempotencyKey: string;
  refType?: string;
  refId?: string;
  note?: string;
  tx?: Tx;
}) {
  const run = async (tx: Tx) => {
    const existing = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return { duplicate: true as const, entry: existing };
    }

    const wallet = await getWalletForUpdate(tx, params.userId);
    const lockedDelta = params.lockedDelta ?? 0n;
    const nextAvailable = wallet.availableMicros + params.availableDelta;
    const nextLocked = wallet.lockedMicros + lockedDelta;

    if (nextAvailable < 0n) {
      throw new LedgerError("Insufficient available balance", 400);
    }
    if (nextLocked < 0n) {
      throw new LedgerError("Invalid locked balance", 400);
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        availableMicros: nextAvailable,
        lockedMicros: nextLocked,
      },
    });

    const entry = await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: params.type,
        amountMicros: params.availableDelta !== 0n ? params.availableDelta : lockedDelta,
        balanceAfterMicros: updated.availableMicros,
        lockedAfterMicros: updated.lockedMicros,
        idempotencyKey: params.idempotencyKey,
        refType: params.refType,
        refId: params.refId,
        note: params.note,
      },
    });

    return { duplicate: false as const, entry, wallet: updated };
  };

  if (params.tx) return run(params.tx);
  return prisma.$transaction(run);
}

export async function creditDeposit(params: {
  userId: string;
  amountMicros: bigint;
  depositId: string;
  txHash: string;
  tx?: Tx;
}) {
  return applyLedgerEntry({
    userId: params.userId,
    type: "DEPOSIT",
    availableDelta: params.amountMicros,
    idempotencyKey: `deposit:${params.txHash}`,
    refType: "deposit",
    refId: params.depositId,
    note: `USDT deposit ${params.txHash}`,
    tx: params.tx,
  });
}

export async function lockWithdrawal(params: {
  userId: string;
  amountMicros: bigint;
  withdrawalId: string;
  tx?: Tx;
}) {
  return applyLedgerEntry({
    userId: params.userId,
    type: "WITHDRAW_LOCK",
    availableDelta: -params.amountMicros,
    lockedDelta: params.amountMicros,
    idempotencyKey: `withdraw-lock:${params.withdrawalId}`,
    refType: "withdrawal",
    refId: params.withdrawalId,
    note: "Withdraw lock",
    tx: params.tx,
  });
}

export async function releaseWithdrawal(params: {
  userId: string;
  amountMicros: bigint;
  withdrawalId: string;
  reason: string;
  tx?: Tx;
}) {
  return applyLedgerEntry({
    userId: params.userId,
    type: "WITHDRAW_RELEASE",
    availableDelta: params.amountMicros,
    lockedDelta: -params.amountMicros,
    idempotencyKey: `withdraw-release:${params.withdrawalId}`,
    refType: "withdrawal",
    refId: params.withdrawalId,
    note: params.reason,
    tx: params.tx,
  });
}

export async function payoutWithdrawal(params: {
  userId: string;
  amountMicros: bigint;
  withdrawalId: string;
  txHash: string;
  tx?: Tx;
}) {
  return applyLedgerEntry({
    userId: params.userId,
    type: "WITHDRAW_PAYOUT",
    availableDelta: 0n,
    lockedDelta: -params.amountMicros,
    idempotencyKey: `withdraw-payout:${params.withdrawalId}`,
    refType: "withdrawal",
    refId: params.withdrawalId,
    note: `Paid ${params.txHash}`,
    tx: params.tx,
  });
}

export async function lockBet(params: {
  userId: string;
  amountMicros: bigint;
  betId: string;
  tx?: Tx;
}) {
  return applyLedgerEntry({
    userId: params.userId,
    type: "BET_LOCK",
    availableDelta: -params.amountMicros,
    lockedDelta: params.amountMicros,
    idempotencyKey: `bet-lock:${params.betId}`,
    refType: "bet",
    refId: params.betId,
    note: "Bet stake lock",
    tx: params.tx,
  });
}

export async function settleBetWin(params: {
  userId: string;
  stakeMicros: bigint;
  payoutMicros: bigint;
  betId: string;
  tx?: Tx;
}) {
  // Release stake from locked, credit full payout to available
  await applyLedgerEntry({
    userId: params.userId,
    type: "BET_SETTLE_WIN",
    availableDelta: params.payoutMicros,
    lockedDelta: -params.stakeMicros,
    idempotencyKey: `bet-settle:${params.betId}`,
    refType: "bet",
    refId: params.betId,
    note: "Bet won",
    tx: params.tx,
  });
}

export async function settleBetLoss(params: {
  userId: string;
  stakeMicros: bigint;
  betId: string;
  tx?: Tx;
}) {
  await applyLedgerEntry({
    userId: params.userId,
    type: "BET_SETTLE_LOSS",
    availableDelta: 0n,
    lockedDelta: -params.stakeMicros,
    idempotencyKey: `bet-settle:${params.betId}`,
    refType: "bet",
    refId: params.betId,
    note: "Bet lost",
    tx: params.tx,
  });
}
