/**
 * Client-facing action pack — what importers/exporters actually need after a CTH pick.
 */
import { formatCode } from "./catalog.js";
import {
  getNeoDeskPrecedents,
  matchNeoDeskPrecedents,
  type NeoDeskMatch,
} from "./neo-desk-precedents.js";
import type {
  ClientActionPack,
  ClassifyRequest,
  DeskAuthenticity,
  HsHit,
  NeoDeskCargoLine,
  RelatedNeoCargo,
} from "./types.js";

export function authenticityFor(
  neoMatch: NeoDeskMatch | null,
  primaryCode: string | undefined,
  engine: string
): DeskAuthenticity {
  if (neoMatch && primaryCode === neoMatch.precedent.code) {
    return {
      tier: "neo_desk_precedent",
      label: "Authenticated against Neo’s filed HS workbook",
      detail:
        "This India CTH matches how Neo Logistics has classified these goods for Cochin / Chennai filing. Still confirm invoice wording with Neo CHA before Bill of Entry / Shipping Bill.",
    };
  }
  if (engine === "hybrid-ai") {
    return {
      tier: "neo_desk_ai",
      label: "Neo CHA desk AI recommendation",
      detail:
        "Selected from India’s CTH index with Neo desk reasoning. Not a prior Neo filing line for this exact goods description — confirm with CHA before filing.",
    };
  }
  return {
    tier: "india_catalog",
    label: "India CTH catalog recommendation",
    detail:
      "Lexical match across India’s 8-digit tariff lines. Share invoice + specs with Neo CHA to lock the code.",
  };
}

function invoiceHint(req: ClassifyRequest, primary: HsHit, neo: NeoDeskMatch | null): string {
  if (neo) {
    return `${neo.precedent.goods} — India CTH ${formatCode(neo.precedent.code)} (${neo.precedent.tradeFlow.toUpperCase()})`;
  }
  const bits = [req.description.trim()];
  if (req.material) bits.push(req.material.trim());
  if (req.form) bits.push(req.form.trim());
  return `${bits.join(", ")} — suggested CTH ${primary.dotted}`;
}

function documentsFor(flow: ClassifyRequest["tradeFlow"]): string[] {
  const common = [
    "Commercial invoice (exact goods wording)",
    "Packing list",
    "Technical specs / SDS / grade certificate (if applicable)",
  ];
  if (flow === "export") {
    return [
      ...common,
      "Shipping Bill draft fields (exporter, IEC, CTH, description)",
      "Any DGFT / export licence note if Restricted",
    ];
  }
  return [
    ...common,
    "Bill of Entry draft fields (importer, IEC, CTH, description)",
    "Bill of lading / AWB + country of origin docs",
  ];
}

function nextSteps(
  authenticity: DeskAuthenticity,
  flow: ClassifyRequest["tradeFlow"],
  ports: string[]
): string[] {
  const filing = flow === "export" ? "Shipping Bill" : "Bill of Entry";
  const portNote =
    ports.length > 0
      ? `Neo handles this cargo at ${ports.join(" / ")} — mention preferred port when you contact desk.`
      : "Tell Neo whether Cochin or Chennai is your preferred filing port.";
  return [
    authenticity.tier === "neo_desk_precedent"
      ? "Copy the desk memo and send to Neo CHA — cite that it matches Neo’s filed HS line."
      : "Copy the desk memo and send to Neo CHA with your commercial invoice.",
    `Ask Neo to lock CTH ${filing === "Shipping Bill" ? "for Shipping Bill" : "for Bill of Entry"} against invoice wording.`,
    portNote,
    "Do not self-file on this educational recommendation alone.",
  ];
}

export function relatedNeoCargo(
  query: string,
  tradeFlow: ClassifyRequest["tradeFlow"],
  excludeCode?: string
): RelatedNeoCargo[] {
  return matchNeoDeskPrecedents(query, tradeFlow)
    .filter((m) => m.precedent.code !== excludeCode)
    .slice(0, 4)
    .map((m) => ({
      goods: m.precedent.goods,
      code: m.precedent.code,
      dotted: formatCode(m.precedent.code),
      tradeFlow: m.precedent.tradeFlow,
      ports: m.precedent.ports,
      matchScore: m.score,
    }));
}

export function buildClientActionPack(
  req: ClassifyRequest,
  primary: HsHit | null,
  neoMatch: NeoDeskMatch | null,
  engine: string
): ClientActionPack | null {
  if (!primary) return null;
  const aligned = neoMatch && primary.code === neoMatch.precedent.code ? neoMatch : null;
  const authenticity = authenticityFor(aligned, primary.code, engine);
  const ports = aligned?.precedent.ports ?? [];
  const flow = req.tradeFlow && req.tradeFlow !== "either" ? req.tradeFlow : aligned?.precedent.tradeFlow ?? "import";
  const filingDocument = flow === "export" ? "Shipping Bill" : "Bill of Entry";
  const invoiceWordingHint = invoiceHint(req, primary, aligned);
  const shareText = [
    `Neo HS desk · ${primary.dotted}`,
    authenticity.tier === "neo_desk_precedent" && aligned
      ? `Neo filed line: ${aligned.precedent.goods}`
      : primary.description.slice(0, 80),
    `Flow: ${flow.toUpperCase()} · ${filingDocument}`,
    ports.length ? `Ports: ${ports.join(" / ")}` : "Ports: Cochin / Chennai",
    "Educational — confirm with Neo CHA before filing.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    authenticity,
    filingDocument,
    preferredPorts: ports.length ? ports : ["COCHIN", "CHENNAI"],
    invoiceWordingHint,
    documentsChecklist: documentsFor(flow),
    nextSteps: nextSteps(authenticity, flow, ports),
    relatedNeoCargo: relatedNeoCargo(buildQueryLoose(req), req.tradeFlow, primary.code),
    shareText,
  };
}

function buildQueryLoose(req: ClassifyRequest): string {
  return [req.description, req.material, req.form, req.endUse].filter(Boolean).join(" ");
}

export function listNeoDeskCargo(filter?: {
  tradeFlow?: "import" | "export";
  q?: string;
}): NeoDeskCargoLine[] {
  const q = (filter?.q ?? "").toLowerCase().trim();
  return getNeoDeskPrecedents()
    .filter((p) => !filter?.tradeFlow || p.tradeFlow === filter.tradeFlow)
    .filter((p) => {
      if (!q) return true;
      return (
        p.goods.toLowerCase().includes(q) ||
        p.code.includes(q.replace(/\D/g, "")) ||
        p.matchTerms.some((t) => t.includes(q))
      );
    })
    .map((p) => ({
      sl: p.sl,
      goods: p.goods,
      code: p.code,
      dotted: formatCode(p.code),
      tradeFlow: p.tradeFlow,
      ports: p.ports,
    }));
}
