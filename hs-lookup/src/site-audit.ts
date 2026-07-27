/**
 * Hard reliability audit — India CTH-8 for Neo cargo + traps.
 * Usage: npm run audit -w @neo-cha/hs-lookup
 */
import { classifyGoods } from "./classify.js";
import { catalogStats } from "./catalog.js";

type Case = {
  name: string;
  description: string;
  material?: string;
  form?: string;
  endUse?: string;
  expect?: RegExp;
  rejectTop?: RegExp;
  severity: "core" | "stretch" | "trap";
};

const cases: Case[] = [
  { name: "cashew kernels", description: "shelled dried cashew kernels for export", expect: /^080132/, severity: "core" },
  { name: "raw cashew in shell", description: "raw cashew nuts in shell", expect: /^080131/, severity: "core" },
  { name: "frozen shrimp", description: "frozen shrimps prawns seafood export India", expect: /^0306/, severity: "core" },
  { name: "HRC steel", description: "hot rolled steel coils HRC over 600mm width", expect: /^7208/, severity: "core" },
  { name: "GI sheet", description: "galvanized zinc coated steel sheets", expect: /^7210/, severity: "core" },
  { name: "portland cement", description: "grey portland cement", expect: /^2523/, severity: "core" },
  { name: "white cement", description: "white portland cement", expect: /^2523/, severity: "core" },
  { name: "cotton fabric", description: "woven cotton fabric unbleached", expect: /^5208|^52/, severity: "core" },
  { name: "polypropylene resin", description: "polypropylene granules primary forms", expect: /^3902/, severity: "core" },
  { name: "methanol", description: "methanol methyl alcohol chemical", expect: /^2905/, severity: "core" },
  { name: "iron ore fines", description: "iron ores non-agglomerated", expect: /^2601/, severity: "core" },
  { name: "LCV goods vehicle", description: "light commercial goods vehicle diesel under 5 tonnes", expect: /^8704/, severity: "core" },
  { name: "sanitary ware basin", description: "ceramic porcelain wash basin sanitary fixture", expect: /^6910/, severity: "core" },
  { name: "electric motor", description: "three phase AC induction motor 15kW", expect: /^8501/, severity: "core" },

  { name: "smartphone", description: "Android smartphone mobile telephone", expect: /^8517/, severity: "stretch" },
  { name: "laptop", description: "portable laptop computer notebook", expect: /^8471/, severity: "stretch" },
  { name: "solar modules", description: "photovoltaic solar panel modules", expect: /^8541/, severity: "stretch" },
  { name: "li-ion battery", description: "lithium ion rechargeable battery packs", expect: /^8507/, severity: "stretch" },
  { name: "gold jewellery", description: "gold jewellery necklace articles", expect: /^7113/, severity: "stretch" },
  { name: "wooden furniture", description: "wooden office furniture desks", expect: /^9403/, severity: "stretch" },
  { name: "crude oil", description: "crude petroleum oils", expect: /^2709/, severity: "stretch" },
  { name: "natural rubber", description: "natural rubber latex", expect: /^4001/, severity: "stretch" },
  { name: "printed books", description: "printed books hardcover", expect: /^4901/, severity: "stretch" },
  { name: "green coffee", description: "green coffee beans not roasted", expect: /^0901/, severity: "stretch" },
  { name: "aluminium scrap", description: "aluminium waste and scrap", expect: /^7602/, severity: "stretch" },
  {
    name: "machinery unspecified",
    description: "industrial process machinery for food packing",
    expect: /^84|^85/,
    severity: "stretch",
  },
  {
    name: "mixed textile garment",
    description: "knitted t-shirts 60% cotton 40% polyester",
    expect: /^61/,
    severity: "stretch",
  },

  {
    name: "trap coffee not cocoa",
    description: "green coffee beans not roasted not decaffeinated",
    expect: /^0901/,
    rejectTop: /^1801/,
    severity: "trap",
  },
  {
    name: "trap furniture not polish",
    description: "wooden furniture for bedroom",
    expect: /^9403/,
    rejectTop: /^3405/,
    severity: "trap",
  },
  {
    name: "trap lithium chem vs battery",
    description: "lithium ion rechargeable battery packs for electric vehicles",
    expect: /^8507/,
    rejectTop: /^28/,
    severity: "trap",
  },
];

async function main() {
  const stats = catalogStats();
  console.log("=== NEO HS FINDER — INDIA CTH AUDIT ===");
  console.log(`Index: ${stats.subheadings} India CTH-8 lines · ${stats.chapters} chapters\n`);

  let corePass = 0,
    coreTotal = 0;
  let stretchPass = 0,
    stretchTotal = 0;
  let trapPass = 0,
    trapTotal = 0;
  let inventFail = 0;
  let nonIndiaFail = 0;

  for (const c of cases) {
    const result = await classifyGoods({
      description: c.description,
      material: c.material,
      form: c.form,
      endUse: c.endUse,
      tradeFlow: "either",
    });
    const top = result.candidates[0]?.code ?? "";
    const topConf = result.candidates[0]?.confidence ?? "none";

    if (top && !/^\d{8}$/.test(top)) inventFail++;
    if (top && top.length !== 8) nonIndiaFail++;

    let ok = true;
    if (c.expect && !c.expect.test(top)) ok = false;
    if (c.rejectTop && c.rejectTop.test(top)) ok = false;
    if (top.length !== 8) ok = false;

    if (c.severity === "core") {
      coreTotal++;
      if (ok) corePass++;
    } else if (c.severity === "stretch") {
      stretchTotal++;
      if (ok) stretchPass++;
    } else {
      trapTotal++;
      if (ok) trapPass++;
    }

    console.log(
      `${ok ? "PASS" : "FAIL"}  [${c.severity}] ${c.name.padEnd(28)} → ${top || "NONE"} (${topConf}, ${result.engine})`
    );
  }

  const corePct = Math.round((corePass / coreTotal) * 100);
  const stretchPct = Math.round((stretchPass / stretchTotal) * 100);
  const trapPct = Math.round((trapPass / trapTotal) * 100);
  const overall = Math.round(
    ((corePass + stretchPass + trapPass) / (coreTotal + stretchTotal + trapTotal)) * 100
  );

  console.log("\n=== SCORES (India CTH-8) ===");
  console.log(`Core Neo commodities:  ${corePass}/${coreTotal} (${corePct}%)`);
  console.log(`Stretch / general:     ${stretchPass}/${stretchTotal} (${stretchPct}%)`);
  console.log(`Trap disambiguation:   ${trapPass}/${trapTotal} (${trapPct}%)`);
  console.log(`Overall hit rate:      ${overall}%`);
  console.log(`Non-8-digit tops:      ${nonIndiaFail} (must be 0)`);
  console.log(`Invented codes:        ${inventFail} (must be 0)`);

  console.log("\n=== VERDICT ===");
  console.log(
    JSON.stringify(
      {
        market: "India",
        corePct,
        stretchPct,
        trapPct,
        overall,
        inventFail,
        nonIndiaFail,
        catalogSize: stats.subheadings,
        indiaCthReady: inventFail === 0 && nonIndiaFail === 0 && corePct >= 85,
      },
      null,
      2
    )
  );

  process.exit(inventFail > 0 || nonIndiaFail > 0 || corePct < 70 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
