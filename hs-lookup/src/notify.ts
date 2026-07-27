import type { ChaHandoffRequest } from "./types.js";

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export function renderChaHandoffEmail(req: ChaHandoffRequest, leadId: string): string {
  const lines = (req.candidates ?? [])
    .slice(0, 5)
    .map(
      (c, i) =>
        `  ${i + 1}. ${c.dotted ?? c.code} — ${c.description}`
    )
    .join("\n");

  return [
    "New Neo HS Finder → CHA confirmation request",
    "",
    `Lead ID: ${leadId}`,
    `Name: ${req.name}`,
    `Email: ${req.email}`,
    `Phone: ${req.phone ?? "(not given)"}`,
    `Company: ${req.company ?? "(not given)"}`,
    `Trade flow: ${req.tradeFlow ?? "either"}`,
    "",
    "Goods description:",
    req.description,
    "",
    "Client shortlist:",
    lines || "  (none)",
    "",
    "Client notes:",
    req.notes?.trim() || "(none)",
    "",
    "Action: Confirm India CTH before Bill of Entry / Shipping Bill. Do not treat shortlist as filing advice.",
    "",
    "Source: Neo HS Finder (Feature 2)",
  ].join("\n");
}

export async function notifyChaHandoff(
  req: ChaHandoffRequest,
  leadId: string
): Promise<{ emailed: boolean; logged: boolean }> {
  const to = env("LEAD_NOTIFY_EMAIL", "customercare@neologistics.org");
  const subject = `HS Finder CHA handoff — ${req.company || req.name}`;
  const body = renderChaHandoffEmail(req, leadId);
  const host = env("SMTP_HOST");

  if (!host) {
    console.log(`\n[hs-finder:cha-handoff:dev]\nTo: ${to}\nSubject: ${subject}\n\n${body}\n`);
    return { emailed: false, logged: true };
  }

  const nodemailer = await import("nodemailer");
  const port = Number(env("SMTP_PORT", "587"));
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: env("SMTP_USER")
      ? { user: env("SMTP_USER"), pass: env("SMTP_PASS") }
      : undefined,
  });

  await transport.sendMail({
    from: env("SMTP_FROM", "Neo HS Finder <noreply@neologistics.org>"),
    to,
    replyTo: req.email,
    subject,
    text: body,
  });

  return { emailed: true, logged: false };
}
