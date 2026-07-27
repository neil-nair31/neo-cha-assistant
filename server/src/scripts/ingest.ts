import { getDb } from "../db/index.js";
import { ingestKnowledge } from "../rag/retrieve.js";

getDb();
const n = ingestKnowledge();
console.log(`Ingested ${n} knowledge chunks.`);
