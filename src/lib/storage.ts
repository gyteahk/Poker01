/**
 * Durable key/value for Netlify (Blobs) with local filesystem fallback.
 * Call getStore only inside request handlers ??never at module top level.
 */

import { promises as fs } from "fs";
import path from "path";

const LOCAL_DIR = path.join(process.cwd(), "data", "blob-fallback");

type BlobLike = {
  get: (
    key: string,
    options?: { type?: "json" | "text" | "arrayBuffer" | "blob" | "stream" },
  ) => Promise<unknown>;
  set: (
    key: string,
    value: string | ArrayBuffer | Blob | ReadableStream | Buffer,
    options?: { metadata?: Record<string, string> },
  ) => Promise<void>;
  setJSON: (key: string, value: unknown) => Promise<void>;
};

export async function getDurableStore(): Promise<BlobLike | null> {
  try {
    const { getStore } = await import("@netlify/blobs");
    return getStore({ name: "poker01", consistency: "strong" }) as BlobLike;
  } catch {
    return null;
  }
}

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

function localPath(key: string) {
  const safe = key.replace(/[^a-zA-Z0-9._/-]/g, "_");
  return path.join(LOCAL_DIR, safe);
}

/** JSON get: Blobs first, then local file fallback. */
export async function durableGetJson<T>(key: string): Promise<T | null> {
  const store = await getDurableStore();
  if (store) {
    try {
      const data = await store.get(key, { type: "json" });
      if (data != null) return data as T;
    } catch {
      // fall through
    }
  }
  try {
    const raw = await fs.readFile(`${localPath(key)}.json`, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function durableSetJson(key: string, value: unknown): Promise<void> {
  const store = await getDurableStore();
  if (store) {
    try {
      await store.setJSON(key, value);
      return;
    } catch {
      // fall through to local
    }
  }
  await ensureLocalDir();
  const dir = path.dirname(`${localPath(key)}.json`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(`${localPath(key)}.json`, JSON.stringify(value, null, 2), "utf8");
}

/** Binary get/set for cover images */
export async function durableGetBinary(
  key: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  const store = await getDurableStore();
  if (store) {
    try {
      const withMeta = store as BlobLike & {
        getWithMetadata?: (
          key: string,
          opts: { type: "arrayBuffer" },
        ) => Promise<{ data: ArrayBuffer; metadata: Record<string, string> } | null>;
      };
      if (typeof withMeta.getWithMetadata === "function") {
        const entry = await withMeta.getWithMetadata(key, { type: "arrayBuffer" });
        if (entry?.data) {
          return {
            data: Buffer.from(entry.data),
            contentType: entry.metadata?.contentType || "image/jpeg",
          };
        }
      } else {
        const buf = await store.get(key, { type: "arrayBuffer" });
        if (buf) {
          return {
            data: Buffer.from(buf as ArrayBuffer),
            contentType: "image/jpeg",
          };
        }
      }
    } catch {
      // fall through
    }
  }
  try {
    const metaRaw = await fs.readFile(`${localPath(key)}.meta.json`, "utf8");
    const meta = JSON.parse(metaRaw) as { contentType?: string };
    const data = await fs.readFile(localPath(key));
    return { data, contentType: meta.contentType || "image/jpeg" };
  } catch {
    return null;
  }
}

export async function durableSetBinary(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<void> {
  const store = await getDurableStore();
  if (store) {
    try {
      await store.set(key, data, {
        metadata: { contentType },
      });
      return;
    } catch {
      // fall through
    }
  }
  await ensureLocalDir();
  const file = localPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  await fs.writeFile(
    `${file}.meta.json`,
    JSON.stringify({ contentType }),
    "utf8",
  );
}
