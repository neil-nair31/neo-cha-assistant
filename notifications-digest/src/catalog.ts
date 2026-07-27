import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NotificationItem } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../data/notifications.json");

let cache: NotificationItem[] | null = null;

export const DISCLAIMER =
  "Neo Customs Notifications Digest provides educational summaries only. " +
  "It is NOT a substitute for the official CBIC / DGFT / ICEGATE text, and NOT legal or duty advice. " +
  "Always verify the operative notification and confirm implications with Neo Logistics’ licensed CHA before acting on a shipment.";

export function loadNotifications(): NotificationItem[] {
  if (cache) return cache;
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Missing notifications data at ${dataPath}`);
  }
  cache = JSON.parse(fs.readFileSync(dataPath, "utf8")) as NotificationItem[];
  return cache;
}

export function resetCache(): void {
  cache = null;
}

export function listNotifications(opts?: {
  q?: string;
  tag?: string;
  source?: string;
  limit?: number;
}): NotificationItem[] {
  let items = [...loadNotifications()].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
  const q = opts?.q?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.impact.toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
    );
  }
  if (opts?.tag) {
    const tag = opts.tag.toLowerCase();
    items = items.filter((n) => n.tags.some((t) => t.toLowerCase() === tag));
  }
  if (opts?.source) {
    items = items.filter((n) => n.source === opts.source);
  }
  const limit = Math.min(opts?.limit ?? 50, 100);
  return items.slice(0, limit);
}

export function getNotification(id: string): NotificationItem | null {
  return loadNotifications().find((n) => n.id === id) ?? null;
}

export function allTags(): string[] {
  const set = new Set<string>();
  for (const n of loadNotifications()) for (const t of n.tags) set.add(t);
  return [...set].sort();
}

export function catalogStats() {
  const items = loadNotifications();
  return {
    total: items.length,
    bySource: items.reduce(
      (acc, n) => {
        acc[n.source] = (acc[n.source] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    tags: allTags().length,
  };
}
