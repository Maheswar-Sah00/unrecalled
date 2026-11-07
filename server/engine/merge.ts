import type { Complaint } from "./types.js";

/**
 * Guard a re-scan against partial NHTSA answers. NHTSA complaint lists only
 * grow, so if a fresh fetch returns fewer complaints for a make/model/year than
 * the previous scan stored (a rate-limited 4xx is read as "no results", or a
 * short page), keep the stored complaints for that year alongside the fresh ones.
 * Returns the merged list and the year keys that were kept from the old scan.
 */
export function keepStoredWhenShorter(
  fresh: Complaint[],
  stored: Complaint[],
): { complaints: Complaint[]; kept: string[] } {
  const key = (c: Complaint) => `${c.make}|${c.model}|${c.modelYear}`;
  const count = (list: Complaint[]) => {
    const m = new Map<string, number>();
    for (const c of list) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return m;
  };
  const freshN = count(fresh);
  const storedN = count(stored);
  const kept = [...storedN].filter(([k, n]) => (freshN.get(k) ?? 0) < n).map(([k]) => k);
  if (!kept.length) return { complaints: fresh, kept };
  const keepSet = new Set(kept);
  const have = new Set(fresh.map((c) => c.odiNumber));
  const extra = stored.filter((c) => keepSet.has(key(c)) && !have.has(c.odiNumber));
  return { complaints: [...fresh, ...extra], kept };
}
