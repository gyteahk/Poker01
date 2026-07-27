import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { durableGetBinary } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const key = `news-images/${safe}`;
  const fromDurable = await durableGetBinary(key);
  if (fromDurable) {
    return new NextResponse(new Uint8Array(fromDurable.data), {
      headers: {
        "Content-Type": fromDurable.contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "news-images", safe);
    const data = await fs.readFile(filePath);
    const contentType = safe.endsWith(".png")
      ? "image/png"
      : safe.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
