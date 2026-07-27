import {
  autoPromoteDrafts,
  getMachineState,
  runContentMachine,
  type MachineRunResult,
} from "./content-machine.js";

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;

function intervalMs(): number {
  const hours = Number(process.env.DIGEST_SCAN_INTERVAL_HOURS ?? 6);
  if (Number.isFinite(hours) && hours > 0) return Math.max(0.25, hours) * 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
}

export function isContentMachineEnabled(): boolean {
  const v = (process.env.DIGEST_AUTO_MACHINE ?? "true").toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

async function tick(reason: string): Promise<MachineRunResult | null> {
  if (running) {
    console.log(`[scheduler] skip (${reason}) — already running`);
    return null;
  }
  running = true;
  try {
    console.log(`[scheduler] content machine start · ${reason}`);
    const promoted = autoPromoteDrafts();
    if (promoted) console.log(`[scheduler] promoted ${promoted} high-quality draft(s)`);
    const result = await runContentMachine();
    console.log(
      `[scheduler] done · published=${result.published} summarized=${result.summarized} · ${result.reason || result.nextHint}`
    );
    return result;
  } catch (err) {
    console.error("[scheduler] content machine failed", err);
    return null;
  } finally {
    running = false;
  }
}

/** Start background content machine (no-op if disabled). */
export function startContentMachineScheduler(): void {
  if (!isContentMachineEnabled()) {
    console.log("[scheduler] DIGEST_AUTO_MACHINE=false — scheduler off (manual scan only)");
    return;
  }

  const ms = intervalMs();
  console.log(
    `[scheduler] Neo content machine ON · every ${ms / 3600000}h · publish=${process.env.DIGEST_PUBLISH_MODE || "draft"}`
  );

  // First run shortly after boot (don't block listen)
  const bootDelay = Number(process.env.DIGEST_BOOT_DELAY_MS ?? 20_000);
  setTimeout(() => {
    void tick("boot");
  }, bootDelay);

  timer = setInterval(() => {
    void tick("interval");
  }, ms);

  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}

export function stopContentMachineScheduler(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export async function runMachineNow(): Promise<MachineRunResult> {
  const promoted = autoPromoteDrafts();
  if (promoted) console.log(`[machine] promoted ${promoted} draft(s)`);
  return runContentMachine({ force: true });
}

export { getMachineState };
