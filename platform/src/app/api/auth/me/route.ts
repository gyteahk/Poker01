import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { jsonOk } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ user: null }, { status: 200 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  return jsonOk({
    user,
    wallet: wallet
      ? {
          available: fromMicros(wallet.availableMicros),
          locked: fromMicros(wallet.lockedMicros),
        }
      : { available: "0", locked: "0" },
  });
}
