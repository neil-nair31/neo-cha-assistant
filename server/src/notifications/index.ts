import { config } from "../config.js";
import type { LeadFields } from "../types.js";

export type NotifyPayload = {
  leadId: string;
  intentType: string;
  isHuge: boolean;
  escalate: boolean;
  lead: LeadFields;
  conversationExcerpt: string;
};

export interface NotifyChannel {
  name: string;
  send(payload: NotifyPayload): Promise<void>;
}

class EmailChannel implements NotifyChannel {
  name = "email";

  async send(payload: NotifyPayload): Promise<void> {
    const subject = `${payload.isHuge ? "🚨 HUGE ENQUIRY" : payload.escalate ? "⚡ Escalation" : "New chat lead"} — Neo Assist`;
    const body = renderEmail(payload);

    if (!config.smtp.host) {
      console.log(`\n[notify:email:dev]\nTo: ${config.leadNotifyEmail}\nSubject: ${subject}\n\n${body}\n`);
      return;
    }

    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });

    await transport.sendMail({
      from: config.smtp.from,
      to: config.leadNotifyEmail,
      subject,
      text: body,
    });
  }
}

class SlackChannel implements NotifyChannel {
  name = "slack";

  async send(payload: NotifyPayload): Promise<void> {
    if (!config.slackWebhookUrl) return;
    await fetch(config.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${payload.isHuge ? "🚨 HUGE" : "New"} Neo Assist lead (${payload.intentType})`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${payload.isHuge ? "Huge enquiry" : "New lead"}*\n${renderEmail(payload).slice(0, 2800)}`,
            },
          },
        ],
      }),
    });
  }
}

class GoogleSheetsChannel implements NotifyChannel {
  name = "sheets";

  async send(payload: NotifyPayload): Promise<void> {
    if (!config.googleSheetsWebhookUrl) return;
    await fetch(config.googleSheetsWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: payload.leadId,
        ...payload.lead,
        intentType: payload.intentType,
        isHuge: payload.isHuge,
        escalate: payload.escalate,
        excerpt: payload.conversationExcerpt.slice(0, 1500),
        createdAt: new Date().toISOString(),
      }),
    });
  }
}

function renderEmail(p: NotifyPayload): string {
  const l = p.lead;
  return [
    `Lead ID: ${p.leadId}`,
    `Intent: ${p.intentType}`,
    `Huge: ${p.isHuge ? "YES" : "no"}`,
    `Escalate: ${p.escalate ? "YES" : "no"}`,
    "",
    `Commodity: ${l.commodity ?? "-"}`,
    `Volume: ${l.volume ?? "-"}`,
    `Origin: ${l.origin ?? "-"}`,
    `Destination: ${l.destination ?? "-"}`,
    `Timeline: ${l.timeline ?? "-"}`,
    `Name: ${l.name ?? "-"}`,
    `Company: ${l.company ?? "-"}`,
    `Email: ${l.email ?? "-"}`,
    `Phone: ${l.phone ?? "-"}`,
    "",
    "Conversation excerpt:",
    p.conversationExcerpt.slice(0, 4000),
  ].join("\n");
}

const registry: Record<string, NotifyChannel> = {
  email: new EmailChannel(),
  slack: new SlackChannel(),
  sheets: new GoogleSheetsChannel(),
};

export async function notifyLead(payload: NotifyPayload): Promise<string[]> {
  const sent: string[] = [];
  for (const name of config.notifyChannels) {
    const channel = registry[name];
    if (!channel) continue;
    try {
      await channel.send(payload);
      sent.push(name);
    } catch (err) {
      console.error(`[notify:${name}] failed`, err);
    }
  }
  return sent;
}
