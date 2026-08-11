import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { getDb } from "./db/index.js";
import { ingestKnowledge } from "./rag/retrieve.js";
import assistantRoutes from "./routes/assistant.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: config.corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "256kb" }));

getDb();
const n = ingestKnowledge();
console.log(`[kb] loaded ${n} chunks from ${config.knowledgeDir}`);

app.get("/api/health", (_req, res) => res.json({ ok: true, feature: "assistant" }));
app.use("/api/assistant", assistantRoutes);

if (fs.existsSync(config.widgetDir)) {
  app.use("/widget", express.static(config.widgetDir));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(config.widgetDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`<!doctype html>
<html><head><title>Neo CHA Assistant</title></head>
<body style="font-family:system-ui;padding:2rem">
  <h1>Neo CHA Assistant API</h1>
  <p>API is running. Build the widget (<code>npm run build -w widget</code>) for the demo UI.</p>
  <p>Health: <a href="/api/assistant/health">/api/assistant/health</a></p>
</body></html>`);
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Neo CHA Assistant listening on http://0.0.0.0:${config.port}`);
  console.log(`Embed drop-in: ${config.port}/widget/neo-assist.js + neo-assist.css`);
});
