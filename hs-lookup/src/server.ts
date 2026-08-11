import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { catalogStats, getIndex } from "./catalog.js";
import router from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../.env");
dotenv.config({ path: rootEnv });
dotenv.config();

// Railway/Render inject PORT; local/dev can use HS_LOOKUP_PORT
const port = Number(process.env.PORT || process.env.HS_LOOKUP_PORT || 8790);
const publicDir = path.resolve(__dirname, "../public");

// Fail fast if index missing
try {
  const stats = catalogStats();
  console.log(
    `[hs-finder] India CTH ready · ${stats.subheadings} 8-digit lines · ${stats.tokens} tokens`
  );
} catch (err) {
  console.error(err);
  console.error("Run: npm run build-index -w @neo-cha/hs-lookup");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? "*").split(",").map((s) => s.trim()),
  })
);
app.use(express.json({ limit: "256kb" }));

app.use("/api", router);

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  const openAi = Boolean(
    process.env.OPENAI_API_KEY &&
      !process.env.OPENAI_API_KEY.includes("your-key") &&
      !process.env.OPENAI_API_KEY.includes("PASTE_")
  );
  const gemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  const model = process.env.HS_AI_MODEL || process.env.AI_MODEL || "(default)";
  console.log(`Neo HS Finder → http://0.0.0.0:${port}`);
  console.log(`API health    → http://0.0.0.0:${port}/api/health`);
  console.log(
    `AI rerank     → ${
      openAi
        ? `enabled (OpenRouter/OpenAI · ${model})`
        : gemini
          ? "enabled (Gemini)"
          : "lexical-only (set OPENAI_API_KEY)"
    }`
  );
  void getIndex();
});
