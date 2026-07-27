/**
 * India CTH smoke — Neo desk workbook + general cargo.
 * Usage: npm run smoke -w @neo-cha/hs-lookup
 */
import { classifyGoods } from "./classify.js";
import { catalogStats } from "./catalog.js";
import { getNeoDeskPrecedents } from "./neo-desk-precedents.js";

const cases: Array<{
  name: string;
  description: string;
  tradeFlow?: "import" | "export" | "either";
  expect: RegExp;
}> = [
  // Neo desk workbook (exact filed lines)
  { name: "white cement clinker", description: "white cement clinker", tradeFlow: "import", expect: /^25231000$/ },
  { name: "sodium chlorate", description: "sodium chlorate", tradeFlow: "import", expect: /^28291100$/ },
  { name: "hydrafiber", description: "hydrafiber", tradeFlow: "import", expect: /^47010000$/ },
  { name: "quick lime", description: "quick lime", tradeFlow: "import", expect: /^25221000$/ },
  { name: "gypsum plaster", description: "gypsum plaster", tradeFlow: "import", expect: /^25202010$/ },
  { name: "VAE dispersion", description: "VAE dispersion polymer for use in paints", tradeFlow: "import", expect: /^39052100$/ },
  { name: "titanium dioxide", description: "titanium dioxide", tradeFlow: "import", expect: /^32061110$/ },
  { name: "raw cashew nuts", description: "dried raw cashew nuts", tradeFlow: "import", expect: /^08013100$/ },
  { name: "ceramic wash basin", description: "sanitary ware ceramic wash basin", tradeFlow: "import", expect: /^69101000$/ },
  { name: "toilet seat cover", description: "plastic toilet seat cover", tradeFlow: "import", expect: /^39222000$/ },
  { name: "bleached kraft pulp", description: "bleached softwood kraft pulp", tradeFlow: "import", expect: /^47032100$/ },
  { name: "unbleached kraft pulp", description: "unbleached softwood kraft pulp", tradeFlow: "import", expect: /^47031100$/ },
  { name: "printing paper sheets", description: "wood free printing paper in sheets", tradeFlow: "import", expect: /^48025790$/ },
  { name: "artificial grass", description: "artificial grass", tradeFlow: "import", expect: /^57033100$/ },
  { name: "unframed mirror", description: "unframed glass mirrors", tradeFlow: "import", expect: /^70099100$/ },
  { name: "bathroom cabinet", description: "bathroom cabinet", tradeFlow: "import", expect: /^94037000$/ },
  { name: "PVC foam board", description: "PVC foam board", tradeFlow: "import", expect: /^39211200$/ },
  { name: "white portland cement", description: "white portland cement", tradeFlow: "import", expect: /^25232100$/ },
  { name: "cashew kernels", description: "cashew kernels", tradeFlow: "export", expect: /^08013220$/ },
  { name: "coco peat", description: "coco peat", tradeFlow: "export", expect: /^53050040$/ },
  { name: "cotton yarn", description: "cotton yarn", tradeFlow: "export", expect: /^52061200$/ },
  { name: "vermi compost", description: "vermi compost", tradeFlow: "export", expect: /^31010099$/ },
  { name: "CI spun pipes", description: "spun pipes made of cast iron", tradeFlow: "export", expect: /^73030030$/ },
  { name: "gasket", description: "gasket", tradeFlow: "export", expect: /^40169340$/ },
  { name: "gasket lubricant", description: "lubricant for pipe gasket", tradeFlow: "export", expect: /^34039900$/ },

  // Broader India coverage
  { name: "raw coffee", description: "green coffee beans not roasted", expect: /^0901/ },
  { name: "frozen shrimp", description: "frozen vannamei shrimp prawns seafood export", expect: /^0306/ },
  { name: "HRC steel", description: "hot-rolled flat steel coils HRC width over 600mm", expect: /^7208/ },
  { name: "paracetamol", description: "paracetamol tablets medicaments", expect: /^3004/ },
];

async function main() {
  const stats = catalogStats();
  const desk = getNeoDeskPrecedents().length;
  console.log(
    `India catalog: ${stats.subheadings} CTH-8 lines · Neo desk precedents: ${desk} · market=${stats.market}\n`
  );
  let pass = 0;
  for (const c of cases) {
    const result = await classifyGoods({
      description: c.description,
      tradeFlow: c.tradeFlow ?? "either",
    });
    const top = result.primary?.code ?? result.candidates[0]?.code ?? "";
    const ok = c.expect.test(top) && top.length === 8;
    if (ok) pass++;
    const badge = result.neoDeskPrecedent ? " [NEO-DESK]" : "";
    console.log(
      `${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(24)} → ${top || "NONE"} (${result.engine})${badge}`
    );
  }
  console.log(`\n${pass}/${cases.length} passed`);
  process.exit(pass === cases.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
