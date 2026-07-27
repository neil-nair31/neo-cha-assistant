import type { NotificationItem, Subscriber } from "./types.js";

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text fallback for clients that block HTML */
export function renderDigestEmail(items: NotificationItem[], sub: Subscriber): string {
  const blocks = items
    .map(
      (n, i) =>
        `${i + 1}. ${n.title}\n` +
        `   ${n.summary}\n` +
        `   Desk takeaway: ${n.impact}\n` +
        `   Official: ${n.sourceUrl}\n`
    )
    .join("\n");

  return [
    `Neo Trade Briefing`,
    ``,
    `Hi ${sub.name || "there"},`,
    ``,
    `Here’s what changed in Indian customs / trade — written for Cochin & Chennai shippers.`,
    `Educational only. Confirm with Neo’s CHA before you change a filing.`,
    ``,
    blocks || "(No new items in this send.)",
    ``,
    `Subscribe / manage: https://www.neologistics.org/customs-notification`,
    `Neo Logistics · customercare@neologistics.org · docschennai@neologistics.org`,
  ].join("\n");
}

/** Branded HTML digest — worth opening, not a log dump */
export function renderDigestEmailHtml(items: NotificationItem[], sub: Subscriber): string {
  const cards = items
    .map(
      (n) => `
      <tr>
        <td style="padding:0 0 28px 0;border-bottom:1px solid #e8eaf2;">
          <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8b93a7;font-weight:700;">
            ${esc(n.source)} · ${esc(n.publishedAt)}
          </p>
          <h2 style="margin:0 0 10px;font-size:20px;line-height:1.3;color:#181b4a;font-family:Georgia,'Times New Roman',serif;">
            ${esc(n.title)}
          </h2>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#3a4154;">
            ${esc(n.summary)}
          </p>
          <p style="margin:0 0 14px;padding:12px 14px;background:#f4f5fb;border-left:3px solid #c8102e;font-size:14px;line-height:1.5;color:#181b4a;">
            <strong style="color:#c8102e;">Desk takeaway:</strong> ${esc(n.impact)}
          </p>
          <a href="${esc(n.sourceUrl)}" style="font-size:13px;font-weight:700;color:#303392;text-decoration:none;">
            Read official notice →
          </a>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f3f4f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#181b4a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="background:#181b4a;padding:28px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-weight:700;">Neo Logistics</p>
              <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-weight:600;">Trade Briefing</h1>
              <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.72);">Cochin &amp; Chennai · Licensed CHA desk</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3a4154;">
                Hi ${esc(sub.name || "there")} — here’s what changed that may matter for your next filing.
                Educational only; Neo’s CHA confirms before you act.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${cards || `<tr><td style="padding:12px 0;color:#8b93a7;">No new items in this send.</td></tr>`}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <a href="https://www.neologistics.org/contact-us/" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#c8102e;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;border-radius:999px;">
                Ask Neo CHA
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f4f5fb;font-size:12px;line-height:1.5;color:#8b93a7;">
              Neo Logistics · customercare@neologistics.org · docschennai@neologistics.org<br/>
              Not duty advice. Confirm on CBIC / DGFT / ICEGATE before filing.<br/>
              <a href="https://www.neologistics.org/customs-notification" style="color:#303392;">Manage subscription</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendDigestToSubscribers(
  items: NotificationItem[],
  subscribers: Subscriber[]
): Promise<{ sent: number; logged: number }> {
  const host = env("SMTP_HOST");
  const from = env("SMTP_FROM", "Neo Trade Briefing <noreply@neologistics.org>");
  let sent = 0;
  let logged = 0;

  for (const sub of subscribers) {
    const subject =
      items.length === 1
        ? `Neo Trade Briefing — ${items[0]!.title.slice(0, 60)}`
        : `Neo Trade Briefing — ${items.length} updates for your desk`;
    const text = renderDigestEmail(items, sub);
    const html = renderDigestEmailHtml(items, sub);

    if (!host) {
      console.log(`\n[digest:dev]\nTo: ${sub.email}\nSubject: ${subject}\n\n${text}\n`);
      logged++;
      continue;
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
    await transport.sendMail({ from, to: sub.email, subject, text, html });
    sent++;
  }

  return { sent, logged };
}
