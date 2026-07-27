/**
 * Client usefulness audit — realistic visitor questions.
 * Usage: npm run client-check -w server
 */
const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:8787";

type Scenario = {
  id: string;
  q: string;
  category: string;
  want: string[];
};

const scenarios: Scenario[] = [
  {
    id: "first_time_importer",
    category: "Onboarding",
    q: "I am importing machinery to Cochin for the first time. What documents do I need and can Neo help?",
    want: ["document", "customs", "cochin", "neo"],
  },
  {
    id: "services_overview",
    category: "Discovery",
    q: "What does Neo Logistics actually do for exporters?",
    want: ["customs", "export", "freight", "cha"],
  },
  {
    id: "cashew_export",
    category: "Commodity",
    q: "We export cashew kernels from Kerala. Does Neo handle this commodity?",
    want: ["cashew", "export", "cochin"],
  },
  {
    id: "aeo_benefit",
    category: "Trust",
    q: "What is AEO and does Neo have it? What benefit for my shipment?",
    want: ["aeo", "neo"],
  },
  {
    id: "chennai_contact",
    category: "Contact",
    q: "How do I reach your Chennai office?",
    want: ["chennai", "docschennai", "044"],
  },
  {
    id: "quote_request",
    category: "Lead capture",
    q: "Please quote for clearing 2 containers of textile from China to Cochin",
    want: ["quote", "consent", "contact", "cannot", "team", "review", "rate"],
  },
  {
    id: "track_shipment",
    category: "Operations",
    q: "Can you track my container MSKU1234567?",
    want: ["can't look up", "live container", "bl", "operations team", "customercare"],
  },
  {
    id: "incoterms_help",
    category: "Guidance",
    q: "Should I use FOB or CIF for importing steel?",
    want: ["fob", "cif", "incoterm", "general", "neo", "depends"],
  },
  {
    id: "competitor",
    category: "Sales",
    q: "Is Neo better than other CHAs in Kochi?",
    want: ["neo", "service", "aeo", "experience", "licensed"],
  },
  {
    id: "random_offtopic",
    category: "Guardrail",
    q: "Best pizza in Kochi?",
    want: ["outside", "customs", "logistics", "only help", "neo assist"],
  },
  {
    id: "huge_project",
    category: "Enterprise",
    q: "Annual contract 500 TEU steel imports via Cochin",
    want: ["priority", "team", "consent", "500", "teu", "sales"],
  },
  {
    id: "internal_ops",
    category: "Honesty",
    q: "What are Neo employee parking rules?",
    want: ["don't have", "approved knowledge", "contact", "won't guess"],
  },
];

function gradeReply(reply: string, want: string[]) {
  const r = reply.toLowerCase();
  const hits = want.filter((w) => r.includes(w.toLowerCase()));
  const navBad = /home \(current\)|about us.*industries/i.test(reply);
  const hasPrice = /(₹|rs\.?\s*\d|\$\s*\d|fee is \d)/i.test(reply);
  const hasDutyPct = /\d+\s?%\s*(duty|bcd|customs)/i.test(reply);
  const minHits = want.length <= 2 ? 1 : 2;
  let useful = hits.length >= minHits;
  if (navBad || hasPrice) useful = false;
  if (hasDutyPct) useful = false;
  const label =
    useful && !hasDutyPct ? "USEFUL" : navBad || hasPrice || hasDutyPct ? "BAD" : "WEAK";
  return { hits, label, navBad, hasPrice, hasDutyPct };
}

async function chat(message: string, sessionId: string) {
  const res = await fetch(`${BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId, language: "en" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{
    reply: string;
    seriousEnquiry?: boolean;
    escalate?: boolean;
    cannotAnswerFromKb?: boolean;
    needsConsent?: boolean;
    offline?: boolean;
  }>;
}

async function main() {
  const health = await fetch(`${BASE}/api/assistant/health`).then((r) => r.json());
  console.log("=== HEALTH ===");
  console.log(JSON.stringify(health, null, 2));
  console.log("");

  let useful = 0;
  let weak = 0;
  let bad = 0;
  const byCategory = new Map<string, string[]>();

  for (const s of scenarios) {
    const body = await chat(s.q, `client-${s.id}-audit`);
    const reply = body.reply ?? "";
    const g = gradeReply(reply, s.want);
    if (g.label === "USEFUL") useful++;
    else if (g.label === "WEAK") weak++;
    else bad++;

    const cat = byCategory.get(s.category) ?? [];
    cat.push(`${g.label}: ${s.id}`);
    byCategory.set(s.category, cat);

    console.log(`--- ${s.id} [${g.label}] (${s.category}) ---`);
    console.log(`Q: ${s.q}`);
    console.log(`A: ${reply.slice(0, 500)}`);
    console.log(
      `Meta: serious=${body.seriousEnquiry} escalate=${body.escalate} cannotAnswer=${body.cannotAnswerFromKb} consent=${body.needsConsent}`
    );
    console.log(`Hits: ${g.hits.join(", ") || "(none)"}`);
    console.log("");
  }

  console.log("=== BY CATEGORY ===");
  for (const [cat, items] of byCategory) {
    console.log(`${cat}: ${items.join("; ")}`);
  }

  console.log("");
  console.log("=== SUMMARY ===");
  console.log(`USEFUL: ${useful}/${scenarios.length}`);
  console.log(`WEAK: ${weak}`);
  console.log(`BAD: ${bad}`);
  const pct = Math.round((useful / scenarios.length) * 100);
  console.log(`Client usefulness score: ${pct}%`);

  let verdict: string;
  if (pct >= 75) verdict = "YES — useful for most client questions on the website";
  else if (pct >= 50) verdict = "PARTIAL — good for core logistics Qs; some gaps for real clients";
  else verdict = "NO — not ready for client-facing use";

  console.log(`Verdict: ${verdict}`);
  process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
