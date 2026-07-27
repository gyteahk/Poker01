import { NextResponse } from "next/server";
import {
  actualOutcome,
  buildSeededScenario,
  correctDecision,
  currentWindowId,
  toPublic,
  type DecisionAction,
  type ScenarioSecret,
} from "@/lib/decision";
import { durableGetJson, durableSetJson } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoteCounts = Record<DecisionAction, number>;

type VoteStore = {
  windowId: number;
  scenario: ScenarioSecret;
  decision: ReturnType<typeof correctDecision>;
  votes: VoteCounts;
};

declare global {
  // eslint-disable-next-line no-var
  var __poker01Daily: VoteStore | undefined;
}

function emptyVotes(): VoteCounts {
  return { fold: 0, call: 0, raise: 0 };
}

async function loadPersistedVotes(windowId: number): Promise<VoteCounts> {
  const data = await durableGetJson<VoteCounts>(`daily-votes-${windowId}`);
  if (
    data &&
    typeof data.fold === "number" &&
    typeof data.call === "number" &&
    typeof data.raise === "number"
  ) {
    return data;
  }
  return emptyVotes();
}

async function savePersistedVotes(windowId: number, votes: VoteCounts) {
  await durableSetJson(`daily-votes-${windowId}`, votes).catch(() => undefined);
}

async function getStore(): Promise<VoteStore> {
  const windowId = currentWindowId();
  const existing = globalThis.__poker01Daily;
  if (existing && existing.windowId === windowId) return existing;

  const scenario = buildSeededScenario(windowId);
  const decision = correctDecision(scenario, 800);
  const votes = await loadPersistedVotes(windowId);
  const store: VoteStore = {
    windowId,
    scenario,
    decision,
    votes,
  };
  globalThis.__poker01Daily = store;
  return store;
}

function voteBreakdown(votes: VoteCounts) {
  const total = votes.fold + votes.call + votes.raise;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return {
    total,
    fold: pct(votes.fold),
    call: pct(votes.call),
    raise: pct(votes.raise),
    counts: votes,
  };
}

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    scenario: toPublic(store.scenario),
    live: true,
    votes: voteBreakdown(store.votes),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    action?: DecisionAction;
    locale?: "zh" | "en";
  } | null;

  const action = body?.action;
  if (action !== "fold" && action !== "call" && action !== "raise") {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const locale = body?.locale === "en" ? "en" : "zh";
  const store = await getStore();
  store.votes[action] += 1;
  await savePersistedVotes(store.windowId, store.votes);

  const math = store.decision;
  const outcome = actualOutcome(store.scenario, locale);
  const correct = action === math.action;

  return NextResponse.json({
    scenario: toPublic(store.scenario),
    yourAction: action,
    correct,
    math,
    outcome,
    votes: voteBreakdown(store.votes),
  });
}
