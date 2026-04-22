import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const sqlite = new Database(process.env.DATABASE_URL ?? './kasyr.db')
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS entrepreneurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      full_name TEXT NOT NULL DEFAULT '',
      tax_id TEXT NOT NULL DEFAULT '',
      "group" INTEGER NOT NULL DEFAULT 3,
      reg_date TEXT NOT NULL DEFAULT '',
      kveds TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id),
      provider TEXT NOT NULL,
      token_encrypted TEXT,
      account_id TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'UAH',
      last_sync TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id),
      name TEXT NOT NULL,
      tax_id TEXT,
      country TEXT NOT NULL DEFAULT 'UA'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
      external_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'UAH',
      exchange_rate REAL,
      category TEXT NOT NULL DEFAULT 'unclassified',
      client_id INTEGER,
      comment TEXT,
      raw_data TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id),
      type TEXT NOT NULL,
      period TEXT NOT NULL,
      due_date TEXT NOT NULL,
      amount REAL,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id),
      period TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      file_url TEXT,
      submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}
