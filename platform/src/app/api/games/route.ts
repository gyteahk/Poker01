import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { launchGame } from "@/lib/providers/games";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    await requireUser();
    const games = await prisma.gameCatalog.findMany({
      where: { enabled: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return jsonOk({ games });
  } catch (err) {
    return handleRouteError(err);
  }
}

const launchSchema = z.object({
  gameId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = launchSchema.parse(await req.json());
    const game = await prisma.gameCatalog.findUnique({ where: { id: body.gameId } });
    if (!game || !game.enabled) return jsonError("Game not found", 404);

    const launched = await launchGame({
      userId: user.id,
      gameExternalId: game.externalId,
      returnUrl: "/games",
    });

    return jsonOk({
      game,
      ...launched,
      note: "Stub launch URL — replace with real provider iframe/redirect",
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
