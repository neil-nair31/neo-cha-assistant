import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PageShell } from "../components/PageShell.tsx";

type HsHit = {
  code: string;
  dotted?: string;
  hs6?: string;
  description: string;
  confidence?: string;
  exportPolicy?: string;
};

type PrimaryRecommendation = {
  code: string;
  dotted: string;
  hs6: string;
  description: string;
  confidence: string;
  exportPolicy?: string;
  tariffPath?: string;
  why: string;
  whatWouldChange: string[];
  label: string;
  filingStatus?: string;
};

type RuledOutLine = {
  code: string;
  dotted: string;
  description: string;
  because: string;
  onlyIf: string;
};

type ClientPack = {
  authenticity: {
    tier: "neo_desk_precedent" | "neo_desk_ai" | "india_catalog";
    label: string;
    detail: string;
  };
  filingDocument: "Bill of Entry" | "Shipping Bill";
  preferredPorts: string[];
  invoiceWordingHint: string;
  documentsChecklist: string[];
  nextSteps: string[];
  relatedNeoCargo: Array<{
    goods: string;
    code: string;
    dotted: string;
    tradeFlow: "import" | "export";
    ports: string[];
  }>;
  shareText: string;
};

type ClassifyResult = {
  deskVerdict?: "recommend" | "recommend_with_caveat" | "needs_clarification";
  deskVerdictLabel?: string;
  primary?: PrimaryRecommendation | null;
  neoDeskPrecedent?: {
    goods: string;
    tradeFlow: "import" | "export";
    ports: string[];
    code: string;
    dotted: string;
    matchScore: number;
  } | null;
  clientPack?: ClientPack | null;
  ruledOut?: RuledOutLine[];
  alternates?: HsHit[];
  candidates?: HsHit[];
  ambiguity?: {
    ambiguous: boolean;
    requireClarify: boolean;
    reasons: string[];
    message: string;
  };
  chaQuestions?: string[];
  nextQuestions?: string[];
  disclaimer?: string;
  indiaNote?: string;
  dutyNote?: string;
  engine?: string;
};

type NeoDeskLine = {
  sl: number;
  goods: string;
  code: string;
  dotted: string;
  tradeFlow: "import" | "export";
  ports: string[];
};

type ExampleShipment = {
  label: string;
  description: string;
  material: string;
  form: string;
  endUse: string;
  tradeFlow: "import" | "export";
};

/** Aligned to Neo desk workbook rows so demo taps light the green authenticity badge */
const EXAMPLES: ExampleShipment[] = [
  {
    label: "Cashew kernels · export",
    description: "CASHEW KERNELS",
    material: "CASHEW KERNELS",
    form: "as shipped for export",
    endUse: "export shipment",
    tradeFlow: "export",
  },
  {
    label: "White cement clinker · import",
    description: "WHITE CEMENT CLINKER",
    material: "WHITE CEMENT CLINKER",
    form: "as imported",
    endUse: "import clearance",
    tradeFlow: "import",
  },
  {
    label: "Titanium dioxide · import",
    description: "TITANIUM DIOXIDE",
    material: "TITANIUM DIOXIDE",
    form: "as imported",
    endUse: "import clearance",
    tradeFlow: "import",
  },
  {
    label: "Coco peat · export",
    description: "COCO PEAT",
    material: "COCO PEAT",
    form: "as shipped for export",
    endUse: "export shipment",
    tradeFlow: "export",
  },
];

export function HsFinder() {
  const [description, setDescription] = useState("");
  const [material, setMaterial] = useState("");
  const [form, setForm] = useState("");
  const [endUse, setEndUse] = useState("");
  const [tradeFlow, setTradeFlow] = useState<"import" | "export">("import");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [health, setHealth] = useState<{
    subheadings?: number;
    cth8?: number;
    market?: string;
    neoDeskPrecedents?: number;
  } | null | undefined>(undefined);
  const [deskLines, setDeskLines] = useState<NeoDeskLine[]>([]);
  const [deskFilter, setDeskFilter] = useState<"all" | "import" | "export">("all");
  const [deskQ, setDeskQ] = useState("");

  const [handoffName, setHandoffName] = useState("");
  const [handoffEmail, setHandoffEmail] = useState("");
  const [handoffPhone, setHandoffPhone] = useState("");
  const [handoffCompany, setHandoffCompany] = useState("");
  const [handoffNotes, setHandoffNotes] = useState("");
  const [handoffConsent, setHandoffConsent] = useState(false);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [handoffMsg, setHandoffMsg] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("neo_hs_health");
      if (cached) setHealth(JSON.parse(cached));
    } catch {
      /* ignore */
    }
    fetch("/api/hs/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setHealth((h) => (h === undefined ? null : h));
          return;
        }
        setHealth(d);
        try {
          sessionStorage.setItem("neo_hs_health", JSON.stringify(d));
        } catch {
          /* ignore */
        }
      })
      .catch(() => setHealth((h) => (h === undefined ? null : h)));
    fetch("/api/hs/neo-desk")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDeskLines(d?.lines ?? []))
      .catch(() => setDeskLines([]));
  }, []);

  const filteredDesk = useMemo(() => {
    const q = deskQ.trim().toLowerCase();
    return deskLines.filter((l) => {
      if (deskFilter !== "all" && l.tradeFlow !== deskFilter) return false;
      if (!q) return true;
      return (
        l.goods.toLowerCase().includes(q) ||
        l.dotted.includes(q) ||
        l.code.includes(q.replace(/\D/g, ""))
      );
    });
  }, [deskLines, deskFilter, deskQ]);

  const runClassify = useCallback(
    async (payload: {
      description: string;
      material: string;
      form: string;
      endUse: string;
      tradeFlow: "import" | "export";
    }) => {
      if (payload.description.trim().length < 2) return;
      setBusy(true);
      setError("");
      setHandoffMsg("");
      setCopyMsg("");
      try {
        const res = await fetch("/api/hs/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: payload.description.trim(),
            material: payload.material.trim() || undefined,
            form: payload.form.trim() || undefined,
            endUse: payload.endUse.trim() || undefined,
            tradeFlow: payload.tradeFlow,
          }),
        });
        if (!res.ok) throw new Error("Classification request failed");
        setResult(await res.json());
        window.setTimeout(() => {
          document.getElementById("hs-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      } catch {
        setResult(null);
        setError(
          "HS Finder is temporarily unavailable. Email customercare@neologistics.org or call Cochin 0484 2669737 / Chennai 044 28419747."
        );
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const classifyPayload = useCallback(async () => {
    await runClassify({ description, material, form, endUse, tradeFlow });
  }, [description, material, form, endUse, tradeFlow, runClassify]);

  function applyExample(ex: ExampleShipment) {
    setDescription(ex.description);
    setMaterial(ex.material);
    setForm(ex.form);
    setEndUse(ex.endUse);
    setTradeFlow(ex.tradeFlow);
    setResult(null);
    setError("");
    void runClassify(ex);
  }

  async function applyDeskLine(line: NeoDeskLine) {
    const payload = {
      description: line.goods,
      material: line.goods.split("-")[0]?.trim() || line.goods,
      form: line.tradeFlow === "export" ? "as shipped for export" : "as imported",
      endUse: line.tradeFlow === "export" ? "export shipment" : "import clearance",
      tradeFlow: line.tradeFlow,
    };
    setDescription(payload.description);
    setMaterial(payload.material);
    setForm(payload.form);
    setEndUse(payload.endUse);
    setTradeFlow(payload.tradeFlow);
    setResult(null);
    setError("");
    await runClassify(payload);
  }

  async function classify(e?: FormEvent) {
    e?.preventDefault();
    await classifyPayload();
  }

  function deskMemoText(r: ClassifyResult): string {
    const p = r.primary;
    if (!p) return "";
    const pack = r.clientPack;
    const lines = [
      "NEO LOGISTICS — INDIA CTH DESK RECOMMENDATION",
      `Verdict: ${r.deskVerdictLabel || r.deskVerdict || ""}`,
      pack?.authenticity ? `Authenticity: ${pack.authenticity.label}` : "",
      "",
    ];
    if (r.neoDeskPrecedent) {
      lines.push(
        `Neo desk precedent: ${r.neoDeskPrecedent.goods} · ${r.neoDeskPrecedent.tradeFlow.toUpperCase()} · ${r.neoDeskPrecedent.ports.join("/")} · ${r.neoDeskPrecedent.dotted}`,
        ""
      );
    }
    lines.push(
      `Primary CTH: ${p.dotted} (${p.code})`,
      p.tariffPath ? `Tariff path: ${p.tariffPath}` : "",
      `Description: ${p.description}`,
      pack ? `Filing document: ${pack.filingDocument}` : "",
      pack ? `Preferred ports: ${pack.preferredPorts.join(" / ")}` : "",
      pack ? `Invoice wording hint: ${pack.invoiceWordingHint}` : "",
      "",
      "Why Neo desk picks this:",
      p.why,
      ""
    );
    if (pack?.documentsChecklist?.length) {
      lines.push("Documents to prepare:");
      pack.documentsChecklist.forEach((d) => lines.push(`- ${d}`));
      lines.push("");
    }
    if (pack?.nextSteps?.length) {
      lines.push("Next steps:");
      pack.nextSteps.forEach((s) => lines.push(`- ${s}`));
      lines.push("");
    }
    if (p.whatWouldChange?.length) {
      lines.push("What would change this:");
      p.whatWouldChange.forEach((w) => lines.push(`- ${w}`));
      lines.push("");
    }
    if (r.ruledOut?.length) {
      lines.push("Considered & ruled out:");
      r.ruledOut.forEach((x) => {
        lines.push(`- ${x.dotted}: ${x.because}`);
        lines.push(`  Only if: ${x.onlyIf}`);
      });
      lines.push("");
    }
    lines.push(
      "Status: educational · pending Neo CHA confirmation · not filing-ready",
      "Neo Logistics · Cochin & Chennai · customercare@neologistics.org"
    );
    return lines.filter((l) => l !== undefined && l !== "").join("\n");
  }

  async function copyText(text: string, okMsg: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg(okMsg);
    } catch {
      setCopyMsg("Could not copy — select the text manually.");
    }
  }

  function downloadMemo() {
    if (!result?.primary) return;
    const blob = new Blob([deskMemoText(result)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neo-cth-${result.primary.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopyMsg("Desk memo downloaded.");
  }

  function applyClarifyHint(q: string) {
    const lower = q.toLowerCase();
    if (/material|composition|fibre|steel|cashew|species/i.test(lower) && !material) {
      setMaterial(q.replace(/\?$/, "").slice(0, 80));
    } else if (/form|packing|powder|coil|kernel|frozen|raw|finished/i.test(lower) && !form) {
      setForm(q.replace(/\?$/, "").slice(0, 80));
    } else if (/end-?use|function|import|export|apparel|food/i.test(lower) && !endUse) {
      setEndUse(q.replace(/\?$/, "").slice(0, 80));
    } else {
      setDescription((d) => (d.includes(q) ? d : `${d.trim()} — note: ${q.replace(/\?$/, "")}`.trim()));
    }
    setCopyMsg("Detail added — tap Get Neo CHA recommendation again.");
  }

  async function sendToCha(e: FormEvent) {
    e.preventDefault();
    if (!result?.primary || !handoffConsent) return;
    const primary = result.primary;
    const ruled = result.ruledOut ?? [];
    setHandoffBusy(true);
    setHandoffMsg("");
    try {
      const res = await fetch("/api/hs/cha-handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: handoffName.trim(),
          email: handoffEmail.trim(),
          phone: handoffPhone.trim() || undefined,
          company: handoffCompany.trim() || undefined,
          tradeFlow,
          description: description.trim(),
          notes: [
            handoffNotes.trim(),
            result.clientPack?.invoiceWordingHint
              ? `Invoice hint: ${result.clientPack.invoiceWordingHint}`
              : "",
            result.neoDeskPrecedent
              ? `Neo precedent: ${result.neoDeskPrecedent.goods} @ ${result.neoDeskPrecedent.dotted}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
          consent: true,
          candidates: [
            {
              code: primary.code,
              dotted: primary.dotted,
              description: primary.description,
            },
            ...ruled.map((h) => ({
              code: h.code,
              dotted: h.dotted,
              description: `${h.description} — ruled out: ${h.because}`,
            })),
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Handoff failed");
      setHandoffMsg(data.message || "Sent to Neo CHA desk.");
    } catch (err) {
      setHandoffMsg(
        "Could not send automatically — use “open email with desk memo” below, or call Cochin 0484 2669737 / Chennai 044 28419747."
      );
    } finally {
      setHandoffBusy(false);
    }
  }

  const primary = result?.primary ?? null;
  const ruledOut = result?.ruledOut ?? [];
  const pack = result?.clientPack ?? null;
  const lineCount = health?.cth8 ?? health?.subheadings;
  const neoCount = health?.neoDeskPrecedents ?? deskLines.length;
  const verdict = result?.deskVerdict;
  const needsClarify = verdict === "needs_clarification" || result?.ambiguity?.requireClarify;
  const missingDeskFields = !material.trim() || !form.trim() || !endUse.trim();
  const isNeoAuth = pack?.authenticity.tier === "neo_desk_precedent" || Boolean(result?.neoDeskPrecedent);

  return (
    <PageShell
      seoTitle="India HS / CTH Desk Recommendation"
      seoDescription="Neo Logistics CHA desk — authentic India CTH from Neo’s filed cargo lines plus full India tariff index. Confirm with licensed CHA before filing."
      breadcrumb={[{ label: "Home", to: "/" }, { label: "HS Code Finder" }]}
      kicker="Neo CHA desk · Cochin & Chennai"
      title="Get the India CTH Neo would file"
      subtitle="Not a Google shortlist. One definitive 8-digit CTH, authenticated against Neo’s filed cargo workbook where it matches — plus documents, ports, and a desk memo you can send to CHA."
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Neo desk authenticity
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {neoCount ? neoCount : health === undefined ? "…" : "—"}
          </p>
          <p className="text-xs text-emerald-900/80">
            {health === undefined && !neoCount
              ? "Loading Neo desk library…"
              : "Filed goods → CTH pairs from Neo’s workbook"}
          </p>
        </div>
        <div className="rounded-xl border border-neo-100 bg-white px-4 py-3 text-sm text-neo-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neo-500">
            India tariff index
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-neo">
            {lineCount ? lineCount.toLocaleString() : health === undefined ? "…" : "—"}
          </p>
          <p className="text-xs text-neo-600">CTH-8 lines checked for every query</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Filing status
          </p>
          <p className="mt-1 font-display text-lg font-bold">Pending CHA lock</p>
          <p className="text-xs text-amber-900/80">Educational — not Bill of Entry / Shipping Bill ready</p>
        </div>
      </div>

      {/* Neo cargo library — Suraj-impressive authenticity surface */}
      <section className="mb-8 rounded-2xl border border-neo-blue/25 bg-gradient-to-br from-neo-50 to-white p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neo-blue">
              Neo filed cargo library
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-neo">
              Tap a line Neo has already classified
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-neo-600">
              Instant desk recommendation from Neo’s Cochin / Chennai HS workbook — the codes they
              actually file.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "import", "export"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                  deskFilter === f
                    ? "bg-neo text-white"
                    : "border border-neo-100 bg-white text-neo-700"
                }`}
                onClick={() => setDeskFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <input
          className="field-input mt-4"
          placeholder="Search Neo cargo — e.g. cashew, kraft, titanium, gasket…"
          value={deskQ}
          onChange={(e) => setDeskQ(e.target.value)}
        />
        <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-neo-100 bg-white">
          {filteredDesk.length === 0 ? (
            <p className="p-4 text-sm text-neo-500">
              {deskLines.length === 0
                ? "Loading Neo desk library…"
                : "No matching Neo filed lines."}
            </p>
          ) : (
            <ul className="divide-y divide-neo-50">
              {filteredDesk.map((line) => (
                <li key={`${line.code}-${line.sl}`}>
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-neo-50/80"
                    onClick={() => void applyDeskLine(line)}
                    disabled={busy}
                  >
                    <span>
                      <span className="font-medium text-neo-900">{line.goods}</span>
                      <span className="mt-0.5 block text-xs text-neo-500">
                        {line.tradeFlow.toUpperCase()} · {line.ports.join(" / ")}
                      </span>
                    </span>
                    <span className="font-mono text-sm font-semibold text-neo-blue">{line.dotted}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <form onSubmit={classify} className="form-card space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neo-blue">
            Or describe your shipment
          </p>
          <p className="mt-1 text-sm text-neo-600">
            Same facts Neo CHA asks on intake — composition, form, end-use, import vs export.
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="hs-flow">
            India trade flow *
          </label>
          <select
            id="hs-flow"
            className="field-input"
            value={tradeFlow}
            onChange={(e) => setTradeFlow(e.target.value as "import" | "export")}
            required
          >
            <option value="import">Import (Bill of Entry)</option>
            <option value="export">Export (Shipping Bill)</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="hs-desc">
            Commercial goods description *
          </label>
          <textarea
            id="hs-desc"
            className="field-input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="As on invoice / packing list — e.g. bleached softwood kraft pulp for paper mill"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="hs-material">
              Composition / material
            </label>
            <input
              id="hs-material"
              className="field-input"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. cashew kernels, mild steel"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="hs-form">
              Physical form / packing
            </label>
            <input
              id="hs-form"
              className="field-input"
              value={form}
              onChange={(e) => setForm(e.target.value)}
              placeholder="e.g. whole shelled, powder"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="hs-use">
              Function / end-use
            </label>
            <input
              id="hs-use"
              className="field-input"
              value={endUse}
              onChange={(e) => setEndUse(e.target.value)}
              placeholder="e.g. food export, paints"
            />
          </div>
        </div>

        {missingDeskFields && (
          <p className="text-sm text-amber-900">
            Tip: fill composition, form, and end-use for a sharper desk lock — or pick from Neo’s
            filed cargo library above.
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neo-500">
            Quick samples
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="rounded-lg border border-neo-100 bg-neo-50 px-3 py-2 text-left text-xs text-neo-800 hover:border-neo-blue"
                onClick={() => applyExample(ex)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Neo desk reviewing tariff lines…" : "Get Neo CHA recommendation"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {result && !error && (
        <div id="hs-result" className="mt-8 space-y-5">
          <div
            className={`rounded-xl border p-4 text-sm ${
              needsClarify
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : isNeoAuth
                  ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                  : verdict === "recommend"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : "border-neo-blue/30 bg-neo-50 text-neo-900"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Desk verdict</p>
            <p className="mt-1 font-display text-lg font-semibold">
              {result.deskVerdictLabel ||
                (needsClarify
                  ? "Do not file — Neo desk needs clarifying answers first"
                  : "Neo desk recommendation")}
            </p>
            {pack?.authenticity && (
              <p className="mt-2 text-sm">
                <span className="font-semibold">{pack.authenticity.label}.</span>{" "}
                {pack.authenticity.detail}
              </p>
            )}
            {result.ambiguity?.reasons?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.ambiguity.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {needsClarify && (result.chaQuestions?.length || result.nextQuestions?.length) ? (
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <h3 className="font-display text-base font-semibold text-neo">
                Answer these before filing
              </h3>
              <p className="mt-1 text-sm text-neo-600">
                Tap a question to add it to the checklist, then run the recommendation again.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(result.chaQuestions ?? result.nextQuestions ?? []).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-950 hover:border-amber-400"
                    onClick={() => applyClarifyHint(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {primary ? (
            <article
              className={`rounded-2xl border-2 bg-white p-6 shadow-card ${
                needsClarify
                  ? "border-amber-300 opacity-90"
                  : isNeoAuth
                    ? "border-emerald-400"
                    : "border-neo-blue/40"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neo-blue">
                {primary.label || "Neo desk recommendation"}
              </p>
              {result.neoDeskPrecedent ? (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
                  Matches Neo filed line: <strong>{result.neoDeskPrecedent.goods}</strong>
                  {" · "}
                  {result.neoDeskPrecedent.tradeFlow.toUpperCase()} at{" "}
                  {result.neoDeskPrecedent.ports.join(" / ")}
                  {" · "}
                  {result.neoDeskPrecedent.dotted}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <h3
                  className={`font-display text-4xl font-bold tracking-tight ${
                    needsClarify ? "text-neo-500" : "text-neo"
                  }`}
                >
                  {primary.dotted}
                </h3>
                <span className="rounded-full bg-neo-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-neo-600">
                  {primary.confidence}
                </span>
                {pack && (
                  <span className="rounded-full bg-neo-blue/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-neo-blue">
                    For {pack.filingDocument}
                  </span>
                )}
                {primary.exportPolicy && primary.exportPolicy !== "Unknown" && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                      primary.exportPolicy === "Free"
                        ? "bg-emerald-50 text-emerald-800"
                        : primary.exportPolicy === "Restricted"
                          ? "bg-amber-50 text-amber-900"
                          : "bg-red-50 text-red-800"
                    }`}
                  >
                    Export policy: {primary.exportPolicy}
                  </span>
                )}
              </div>
              {primary.tariffPath && (
                <p className="mt-2 font-mono text-xs text-neo-500">{primary.tariffPath}</p>
              )}
              <p className="mt-3 text-base font-medium text-neo-900">{primary.description}</p>
              <div className="mt-5 border-t border-neo-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neo-500">
                  Why Neo desk picks this
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neo-800">{primary.why}</p>
              </div>
              {primary.whatWouldChange?.length ? (
                <div className="mt-4 rounded-xl bg-neo-50/80 p-3 text-sm text-neo-700">
                  <p className="font-semibold text-neo">What would change this recommendation</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {primary.whatWouldChange.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-4 text-xs font-medium text-neo-500">
                Status: educational · pending Neo CHA confirmation · not Bill of Entry / Shipping
                Bill ready
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void copyText(deskMemoText(result), "Desk memo copied — paste to Neo CHA.")}
                >
                  Copy desk memo
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-neo-200 bg-white px-4 py-2 text-sm font-semibold text-neo hover:border-neo-blue"
                  onClick={downloadMemo}
                >
                  Download .txt
                </button>
                {pack?.shareText && (
                  <button
                    type="button"
                    className="rounded-lg border border-neo-200 bg-white px-4 py-2 text-sm font-semibold text-neo hover:border-neo-blue"
                    onClick={() =>
                      void copyText(pack.shareText, "Short share text copied (WhatsApp / SMS).")
                    }
                  >
                    Copy WhatsApp blurb
                  </button>
                )}
                {copyMsg && <span className="self-center text-xs text-neo-600">{copyMsg}</span>}
              </div>
            </article>
          ) : (
            <p className="text-sm text-neo-600">
              No confident India CTH yet. Add composition, form, species/grade — or pick from Neo’s
              filed cargo library.
            </p>
          )}

          {/* Client action pack */}
          {pack && primary && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-neo-100 bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-neo">What to do next</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neo-800">
                  {pack.nextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neo-500">
                  Preferred Neo ports
                </p>
                <p className="mt-1 text-sm font-medium text-neo">{pack.preferredPorts.join(" · ")}</p>
              </div>
              <div className="rounded-2xl border border-neo-100 bg-white p-5">
                <h3 className="font-display text-lg font-semibold text-neo">
                  Documents for {pack.filingDocument}
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neo-800">
                  {pack.documentsChecklist.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="mt-4 rounded-xl bg-neo-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neo-500">
                    Suggested invoice wording
                  </p>
                  <p className="mt-1 text-sm text-neo-900">{pack.invoiceWordingHint}</p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-neo-blue hover:underline"
                    onClick={() =>
                      void copyText(pack.invoiceWordingHint, "Invoice wording copied.")
                    }
                  >
                    Copy invoice hint
                  </button>
                </div>
              </div>
            </div>
          )}

          {pack?.relatedNeoCargo && pack.relatedNeoCargo.length > 0 && (
            <div>
              <h3 className="font-display text-base font-semibold text-neo">
                Related Neo filed cargo
              </h3>
              <p className="mt-1 text-sm text-neo-600">
                Nearby lines from Neo’s workbook — tap to switch recommendation.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pack.relatedNeoCargo.map((r) => (
                  <button
                    key={r.code + r.goods}
                    type="button"
                    className="rounded-lg border border-neo-100 bg-neo-50 px-3 py-2 text-left text-xs hover:border-neo-blue"
                    onClick={() =>
                      void applyDeskLine({
                        sl: 0,
                        goods: r.goods,
                        code: r.code,
                        dotted: r.dotted,
                        tradeFlow: r.tradeFlow,
                        ports: r.ports,
                      })
                    }
                  >
                    <span className="font-semibold text-neo-900">{r.goods}</span>
                    <span className="mt-0.5 block font-mono text-neo-blue">{r.dotted}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {ruledOut.length > 0 && (
            <div>
              <h3 className="font-display text-lg font-semibold text-neo">
                Considered & ruled out
              </h3>
              <p className="mt-1 text-sm text-neo-600">
                Close lines Neo desk reviewed — only file these if the condition below is true.
              </p>
              <ul className="mt-3 space-y-3">
                {ruledOut.map((h) => (
                  <li key={h.code} className="rounded-2xl border border-neo-100 bg-white p-4">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-xl font-bold text-neo-600">{h.dotted}</span>
                      <span className="text-xs uppercase tracking-wide text-neo-400">Not primary</span>
                    </div>
                    <p className="mt-1 text-sm text-neo-900">{h.description}</p>
                    <p className="mt-2 text-sm text-neo-700">
                      <span className="font-semibold">Why not: </span>
                      {h.because}
                    </p>
                    <p className="mt-1 text-sm text-neo-700">
                      <span className="font-semibold">Only if: </span>
                      {h.onlyIf}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!needsClarify && (result.chaQuestions?.length || result.nextQuestions?.length) ? (
            <div>
              <h3 className="font-display text-base font-semibold text-neo">
                For Neo CHA confirmation
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {(result.chaQuestions ?? result.nextQuestions ?? []).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-lg border border-neo-100 bg-neo-50 px-3 py-2 text-left text-xs text-neo-800 hover:border-neo-blue"
                    onClick={() => applyClarifyHint(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {primary && (
            <form onSubmit={sendToCha} className="form-card space-y-4 border-neo-blue/20">
              <div>
                <h3 className="font-display text-lg font-semibold text-neo">
                  Send desk recommendation to Neo CHA
                </h3>
                <p className="mt-1 text-sm text-neo-600">
                  Cochin / Chennai licensed CHA locks the CTH for filing. Includes invoice hint +
                  precedent note automatically.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="ho-name">
                    Name *
                  </label>
                  <input
                    id="ho-name"
                    className="field-input"
                    required
                    value={handoffName}
                    onChange={(e) => setHandoffName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ho-email">
                    Email *
                  </label>
                  <input
                    id="ho-email"
                    type="email"
                    className="field-input"
                    required
                    value={handoffEmail}
                    onChange={(e) => setHandoffEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ho-phone">
                    Phone
                  </label>
                  <input
                    id="ho-phone"
                    className="field-input"
                    value={handoffPhone}
                    onChange={(e) => setHandoffPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ho-company">
                    Company
                  </label>
                  <input
                    id="ho-company"
                    className="field-input"
                    value={handoffCompany}
                    onChange={(e) => setHandoffCompany(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="ho-notes">
                  Invoice refs / specs for CHA
                </label>
                <textarea
                  id="ho-notes"
                  className="field-input min-h-[72px]"
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-neo-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={handoffConsent}
                  onChange={(e) => setHandoffConsent(e.target.checked)}
                  required
                />
                <span>
                  I agree Neo Logistics may contact me. This is an educational desk recommendation —
                  final CTH is confirmed by a licensed CHA.
                </span>
              </label>
              <button type="submit" className="btn-primary" disabled={handoffBusy || !handoffConsent}>
                {handoffBusy ? "Sending…" : "Email desk recommendation to Neo CHA"}
              </button>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  className="font-semibold text-neo-blue hover:underline"
                  href={`mailto:customercare@neologistics.org?subject=${encodeURIComponent(
                    `Neo HS desk memo — ${primary.dotted || primary.code}`
                  )}&body=${encodeURIComponent(deskMemoText(result))}`}
                >
                  Or open email with desk memo →
                </a>
                <a className="font-semibold text-neo-blue hover:underline" href="tel:+914842669737">
                  Call Cochin
                </a>
                <a className="font-semibold text-neo-blue hover:underline" href="tel:+914428419747">
                  Call Chennai
                </a>
              </div>
              {handoffMsg && <p className="text-sm text-neo-700">{handoffMsg}</p>}
            </form>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">India filing note</p>
            <p className="mt-1">
              {result.indiaNote ||
                "Educational India CTH recommendation only. Confirm on ICEGATE / CBIC / DGFT before filing."}
            </p>
            <p className="mt-2 text-amber-900/90">
              {result.dutyNote ||
                "No live Basic Customs Duty or IGST is quoted here — rates and notifications change."}
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
