import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import portalRouter from "./routes.js";
import { getDb } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const port = Number(process.env.PORTAL_PORT || 8792);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.redirect("/app/");
});

app.use("/api", portalRouter);

const webDist = path.resolve(__dirname, "../web/dist");
app.use("/app", express.static(webDist));
app.get("/app/*", (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send(
        "Portal UI not built yet. Run: npm run dev:web -w @neo-cha/client-portal (or npm run build:web)."
      );
    }
  });
});

app.listen(port, () => {
  const db = getDb();
  console.log(`Neo Client Portal API http://localhost:${port}`);
  console.log(`  API  http://localhost:${port}/api/health`);
  console.log(`  UI   http://localhost:${port}/app/  (after build) or Vite :5175`);
  console.log(`  Seed ${db.shipments.length} shipments · ${db.clients.length} demo clients`);
});
