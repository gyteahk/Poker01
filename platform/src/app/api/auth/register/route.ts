import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { handleRouteError, jsonOk } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(40),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: body.displayName.trim(),
        wallet: { create: {} },
      },
      select: { id: true, email: true, displayName: true, role: true },
    });

    await createSession(user.id);
    return jsonOk({ user });
  } catch (err) {
    return handleRouteError(err);
  }
}
