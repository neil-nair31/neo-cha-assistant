import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Subscriber } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../data/subscribers.json");

function readAll(): Subscriber[] {
  if (!fs.existsSync(storePath)) return [];
  return JSON.parse(fs.readFileSync(storePath, "utf8")) as Subscriber[];
}

function writeAll(items: Subscriber[]): void {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(items, null, 2));
}

export function listActiveSubscribers(): Subscriber[] {
  return readAll().filter((s) => s.active);
}

export function subscribe(input: {
  email: string;
  name?: string;
  company?: string;
  topics?: string[];
}): Subscriber {
  const email = input.email.trim().toLowerCase();
  const all = readAll();
  const existing = all.find((s) => s.email === email);
  if (existing) {
    existing.active = true;
    existing.name = input.name ?? existing.name;
    existing.company = input.company ?? existing.company;
    existing.topics = input.topics?.length ? input.topics : existing.topics;
    existing.consentAt = new Date().toISOString();
    writeAll(all);
    return existing;
  }
  const sub: Subscriber = {
    id: randomUUID(),
    email,
    name: input.name,
    company: input.company,
    topics: input.topics?.length ? input.topics : ["all"],
    consentAt: new Date().toISOString(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  all.push(sub);
  writeAll(all);
  return sub;
}

export function unsubscribe(email: string): boolean {
  const all = readAll();
  const hit = all.find((s) => s.email === email.trim().toLowerCase());
  if (!hit) return false;
  hit.active = false;
  writeAll(all);
  return true;
}
