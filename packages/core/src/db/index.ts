/**
 * SQLite wrapper — kairos.db local.
 *
 * Schema inicial (Sprint 1):
 *   - conversations (id, created_at, updated_at, title)
 *   - messages     (id, conversation_id, role, content, created_at)
 *   - settings     (key, value)
 *   - logs         (id, level, message, context, created_at)
 */

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export interface KairósDB {
  raw: Database.Database;
  close: () => void;
}

export function openDatabase(workspaceDir: string): KairósDB {
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }
  const dbPath = path.join(workspaceDir, "kairos.db");
  const raw = new Database(dbPath);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");

  // Schema mínimo — Sprint 1 expande.
  raw.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      title TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      context TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  `);

  return {
    raw,
    close: () => raw.close(),
  };
}
