import { NextResponse } from "next/server";
import { AuthError } from "./auth";
import { LedgerError } from "./ledger";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(err: unknown) {
  if (err instanceof AuthError) return jsonError(err.message, err.status);
  if (err instanceof LedgerError) return jsonError(err.message, err.status);
  if (err instanceof ZodError) {
    return jsonError(err.errors.map((e) => e.message).join("; "), 400);
  }
  if (err instanceof Error) {
    console.error(err);
    return jsonError(err.message || "Server error", 500);
  }
  return jsonError("Server error", 500);
}
