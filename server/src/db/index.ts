import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  db = new Database(config.databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      message_count INTEGER NOT NULL DEFAULT 0,
      serious_enquiry INTEGER NOT NULL DEFAULT 0,
      huge_enquiry INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      citations_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consents (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      consent_version TEXT NOT NULL,
      consent_text TEXT NOT NULL,
      consented_at TEXT NOT NULL,
      ip TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      commodity TEXT,
      volume TEXT,
      origin TEXT,
      destination TEXT,
      timeline TEXT,
      name TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      full_conversation TEXT,
      intent_type TEXT NOT NULL DEFAULT 'enquiry',
      status TEXT NOT NULL DEFAULT 'new',
      is_huge INTEGER NOT NULL DEFAULT 0,
      consent_id TEXT,
      created_at TEXT NOT NULL,
      anonymized_at TEXT,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deletion_requests (
      id TEXT PRIMARY KEY,
      email TEXT,
      phone TEXT,
      conversation_id TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      conversation_id TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kb_chunks (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      source TEXT,
      content TEXT NOT NULL,
      tokens INTEGER NOT NULL DEFAULT 0,
      embedding_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE INDEX IF NOT EXISTS idx_kb_section ON kb_chunks(section);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
  `);
}
