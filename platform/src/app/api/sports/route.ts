import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lockBet } from "@/lib/ledger";
import { parseOdds, selectionOdds } from "@/lib/providers/sports";
import { toMicros, fromMicros } from "@/lib/money";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireUser();
    const events = await prisma.sportEvent.findMany({
      where: { sport: "football", status: "open" },
      orderBy: { startsAt: "asc" },
    });
    return jsonOk({
      events: events.map((e) => ({
        id: e.id,
        league: e.league,
        homeTeam: e.homeTeam,
        awayTeam: e.awayTeam,
        startsAt: e.startsAt,
        odds: parseOdds(e.oddsJson),
      })),
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

const betSchema = z.object({
  eventId: z.string().min(1),
  selection: z.enum(["home", "draw", "away"]),
  stakeUsdt: z.number().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = betSchema.parse(await req.json());
    const event = await prisma.sportEvent.findUnique({ where: { id: body.eventId } });
    if (!event || event.status !== "open") return jsonError("Event not open", 400);

    const odds = selectionOdds(parseOdds(event.oddsJson), body.selection);
    const stakeMicros = toMicros(body.stakeUsdt);
    const potentialMicros = BigInt(Math.round(Number(stakeMicros) * odds));

    const bet = await prisma.$transaction(async (tx) => {
      const created = await tx.bet.create({
        data: {
          userId: user.id,
          source: "sports",
          provider: event.provider,
          sportEventId: event.id,
          selection: body.selection,
          stakeMicros,
          potentialMicros,
          odds,
          status: "PENDING",
        },
      });
      await lockBet({
        userId: user.id,
        amountMicros: stakeMicros,
        betId: created.id,
        tx,
      });
      return created;
    });

    return jsonOk({
      betId: bet.id,
      selection: bet.selection,
      odds: bet.odds,
      stake: fromMicros(bet.stakeMicros),
      potentialWin: fromMicros(bet.potentialMicros ?? 0n),
      status: bet.status,
      note: "Stake locked. Settlement comes from sports provider callback (stub later).",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
