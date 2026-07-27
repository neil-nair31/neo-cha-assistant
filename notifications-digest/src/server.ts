import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { blogStats, loadBlogPosts } from "./blog-store.js";
import router from "./routes.js";
import { startContentMachineScheduler } from "./scheduler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../.env");
dotenv.config({ path: rootEnv });
dotenv.config();

const port = Number(process.env.NOTIFICATIONS_DIGEST_PORT ?? 8791);
const publicDir = path.resolve(__dirname, "../public");

try {
  loadBlogPosts();
  const stats = blogStats();
  console.log(
    `[ai-digest] v3 ready · ${stats.total} posts · status=${JSON.stringify(stats.byStatus)} · sources=${JSON.stringify(stats.bySource)}`
  );
} catch (err) {
  console.error(err);
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
  app.get("/ops", (_req, res) => {
    res.sendFile(path.join(publicDir, "ops.html"));
  });
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`AI Customs Notifications Digest → http://localhost:${port}`);
  console.log(`Blog API (published)            → http://localhost:${port}/api/blog-posts`);
  console.log(`Ops review gate                 → http://localhost:${port}/ops`);
  console.log(`Content machine (manual)        → npm run machine:notifications`);
  startContentMachineScheduler();
});
