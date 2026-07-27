import { getDb } from "../db/index.js";
import { runRetentionCleanup } from "../assistant/service.js";

getDb();
const result = runRetentionCleanup();
console.log("Retention cleanup complete:", result);
