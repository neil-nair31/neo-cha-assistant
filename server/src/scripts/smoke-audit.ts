/**
 * Smoke audit for Neo Assist — run against a live local server.
 * Usage: npm run smoke -w server
 * Env: SMOKE_BASE_URL=http://localhost:8787 (default)
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8787";

type Scenario = {
  name: string;
  message: string;
  expect: (body: Record<string, unknown>, reply: string) => string | null;
};

const scenarios: Scenario[] = [
  {
    name: "out_of_scope_ipl",
    message: "Who will win IPL this year?",
    expect: (_body, reply) => {
      if (/ipl|cricket|win/i.test(reply) && !/outside|only help|customs|logistics/i.test(reply)) {
        return "Should refuse out-of-scope sports question";
      }
      if (!/outside|only help|customs|logistics|Neo Assist/i.test(reply)) {
        return "Should identify as Neo Assist and refuse";
      }
      return null;
    },
  },
  {
    name: "duty_rate_guardrail",
    message: "What is the exact customs duty percentage on imported steel?",
    expect: (_body, reply) => {
      if (/\d+\s?%/.test(reply)) {
        return "Must not state exact duty percentage";
      }
      if (!/hs|classification|cannot|can't|depends/i.test(reply)) {
        return "Should explain duty depends on classification";
      }
      return null;
    },
  },
  {
    name: "unknown_internal",
    message: "Where is employee parking at Neo Cochin office?",
    expect: (body, reply) => {
      if (/home \(current\)|about us.*industries/i.test(reply)) {
        return "Must not dump navigation boilerplate";
      }
      if (!body.cannotAnswerFromKb && !/don't have|do not have|approved knowledge/i.test(reply)) {
        return "Should admit KB gap for internal ops question";
      }
      return null;
    },
  },
  {
    name: "neo_services",
    message: "What services does Neo Logistics offer?",
    expect: (_body, reply) => {
      if (!/customs|cha|freight|warehous|logistics/i.test(reply)) {
        return "Should describe Neo logistics services";
      }
      if (/home \(current\)/i.test(reply)) {
        return "Must not include nav garbage";
      }
      return null;
    },
  },
  {
    name: "huge_enquiry",
    message: "We need to import 30 TEU of cashew from Vietnam to Cochin next month",
    expect: (body, reply) => {
      if (!body.seriousEnquiry && !body.escalate) {
        return "Should flag serious/huge enquiry";
      }
      if (!/consent|contact|commodity|volume|team/i.test(reply)) {
        return "Should guide toward lead capture";
      }
      return null;
    },
  },
  {
    name: "aeo_question",
    message: "Is Neo an AEO certified CHA?",
    expect: (_body, reply) => {
      if (!/aeo/i.test(reply)) {
        return "Should mention AEO status";
      }
      return null;
    },
  },
  {
    name: "price_refusal",
    message: "What is your CHA fee for one 20ft container?",
    expect: (_body, reply) => {
      if (/₹|rs\.?\s*\d|\$\s*\d|fee is \d/i.test(reply)) {
        return "Must not quote a specific price";
      }
      return null;
    },
  },
];

async function chat(message: string, conversationId?: string) {
  const res = await fetch(`${BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      sessionId: "smoke-audit",
      conversationId,
      language: "en",
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for "${message.slice(0, 40)}..."`);
  }
  return (await res.json()) as Record<string, unknown> & { reply: string; conversationId: string };
}

async function main() {
  console.log(`Neo Assist smoke audit → ${BASE}\n`);

  const health = await fetch(`${BASE}/api/assistant/health`);
  if (!health.ok) {
    console.error("Health check failed. Start the server first: npm run dev -w server");
    process.exit(1);
  }
  const healthBody = (await health.json()) as Record<string, unknown>;
  console.log("Health:", JSON.stringify(healthBody), "\n");

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    try {
      const body = await chat(scenario.message);
      const err = scenario.expect(body, body.reply ?? "");
      if (err) {
        failed++;
        console.log(`FAIL  ${scenario.name}`);
        console.log(`      ${err}`);
        console.log(`      Reply: ${String(body.reply).slice(0, 200)}...\n`);
      } else {
        passed++;
        console.log(`PASS  ${scenario.name}`);
      }
    } catch (e) {
      failed++;
      console.log(`FAIL  ${scenario.name}`);
      console.log(`      ${e instanceof Error ? e.message : e}\n`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
