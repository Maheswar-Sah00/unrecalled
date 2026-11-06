// Tiny JSON file cache: cacheDir/<relPath>, reused while younger than maxAgeHours.
import { promises as fs } from "node:fs";
import path from "node:path";

export async function readJsonIfFresh<T>(file: string, maxAgeHours: number): Promise<T | null> {
  try {
    const st = await fs.stat(file);
    if (Date.now() - st.mtimeMs > maxAgeHours * 3600_000) return null;
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value));
  await fs.rename(tmp, file);
}

/** Return cached JSON at cacheDir/relPath if fresh, else run loader, store, and return. */
export async function cachedJson<T>(
  cacheDir: string | undefined,
  relPath: string,
  maxAgeHours: number,
  loader: () => Promise<T>,
): Promise<T> {
  if (!cacheDir) return loader();
  const file = path.join(cacheDir, relPath);
  const hit = await readJsonIfFresh<T>(file, maxAgeHours);
  if (hit !== null) return hit;
  const value = await loader();
  try {
    await writeJson(file, value);
  } catch (err) {
    console.warn(`[unrecalled] cache write failed for ${file}:`, err);
  }
  return value;
}

export function safeKey(s: string): string {
  return s.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "_";
}
