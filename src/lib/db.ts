import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import type { Game, Player, PlayerCategory, PlayerStatus } from "./types";
import { OTHERS_GAME_SLUG } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads", "photos");
const DB_PATH = path.join(DATA_DIR, "registration-hub.db");

const DESIRED_GAMES: Array<[string, string]> = [
  ["Sim Racing", "sim-racing"],
  ["Game of Generals", "game-of-generals"],
  ["Others", OTHERS_GAME_SLUG],
];

declare global {
  // eslint-disable-next-line no-var
  var __registrationHubDb: Database.Database | undefined;
}

function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function hasColumn(db: Database.Database, table: string, column: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  return cols.some((c) => c.name === column);
}

function syncGames(db: Database.Database) {
  db.prepare("UPDATE games SET active = 0").run();
  const upsert = db.prepare(`
    INSERT INTO games (name, slug, active)
    VALUES (?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET name = excluded.name, active = 1
  `);
  for (const [name, slug] of DESIRED_GAMES) {
    upsert.run(name, slug);
  }
}

function seed(db: Database.Database) {
  syncGames(db);

  const encoderCount = db
    .prepare("SELECT COUNT(*) as count FROM encoders")
    .get() as { count: number };
  if (encoderCount.count === 0) {
    const hash = bcrypt.hashSync("encoder123", 10);
    db.prepare(
      "INSERT INTO encoders (username, password_hash, display_name) VALUES (?, ?, ?)",
    ).run("encoder", hash, "Lead Encoder");
  }

}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS encoders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      birthdate TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      category TEXT NOT NULL CHECK (category IN ('casual', 'amateur', 'student')),
      game_id INTEGER NOT NULL REFERENCES games(id),
      game_other TEXT,
      photo_path TEXT,
      status TEXT NOT NULL DEFAULT 'licensed' CHECK (status IN ('licensed', 'inactive')),
      encoded_by INTEGER REFERENCES encoders(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_players_license ON players(license_id);
    CREATE INDEX IF NOT EXISTS idx_players_name ON players(full_name);
    CREATE INDEX IF NOT EXISTS idx_players_game ON players(game_id);
    CREATE INDEX IF NOT EXISTS idx_players_category ON players(category);
  `);

  if (!hasColumn(db, "players", "game_other")) {
    db.exec("ALTER TABLE players ADD COLUMN game_other TEXT");
  }
}

export function getDb() {
  ensureDirs();
  if (!global.__registrationHubDb) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    global.__registrationHubDb = db;
  }

  const db = global.__registrationHubDb;
  initSchema(db);
  seed(db);
  return db;
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

function mapPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as number,
    licenseId: row.license_id as string,
    fullName: row.full_name as string,
    birthdate: row.birthdate as string,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    category: row.category as PlayerCategory,
    gameId: row.game_id as number,
    gameName: (row.game_name as string | undefined) ?? undefined,
    gameSlug: (row.game_slug as string | undefined) ?? undefined,
    gameOther: (row.game_other as string | null) ?? null,
    photoPath: (row.photo_path as string | null) ?? null,
    status: row.status as PlayerStatus,
    encodedBy: (row.encoded_by as number | null) ?? null,
    encoderName: (row.encoder_name as string | null | undefined) ?? null,
    createdAt: row.created_at as string,
  };
}

const PLAYER_SELECT = `
  SELECT
    p.*,
    g.name AS game_name,
    g.slug AS game_slug,
    e.display_name AS encoder_name
  FROM players p
  JOIN games g ON g.id = p.game_id
  LEFT JOIN encoders e ON e.id = p.encoded_by
`;

export function listGames(): Game[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM games WHERE active = 1
       ORDER BY CASE slug
         WHEN 'sim-racing' THEN 1
         WHEN 'game-of-generals' THEN 2
         WHEN 'others' THEN 3
         ELSE 99
       END`,
    )
    .all() as Game[];
}

export function getGameById(id: number): Game | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM games WHERE id = ?").get(id) as
    | Game
    | undefined;
  return row ?? null;
}

export function listPlayers(filters?: {
  q?: string;
  gameId?: number;
  category?: PlayerCategory;
  status?: PlayerStatus;
}): Player[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.q) {
    clauses.push(
      "(p.full_name LIKE ? OR p.license_id LIKE ? OR p.email LIKE ? OR IFNULL(p.game_other, '') LIKE ?)",
    );
    const like = `%${filters.q}%`;
    params.push(like, like, like, like);
  }
  if (filters?.gameId) {
    clauses.push("p.game_id = ?");
    params.push(filters.gameId);
  }
  if (filters?.category) {
    clauses.push("p.category = ?");
    params.push(filters.category);
  }
  if (filters?.status) {
    clauses.push("p.status = ?");
    params.push(filters.status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`${PLAYER_SELECT} ${where} ORDER BY p.created_at DESC`)
    .all(...params) as Record<string, unknown>[];
  return rows.map(mapPlayer);
}

export function getPlayerById(id: number): Player | null {
  const db = getDb();
  const row = db.prepare(`${PLAYER_SELECT} WHERE p.id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? mapPlayer(row) : null;
}

export function getRecentPlayers(limit = 8): Player[] {
  const db = getDb();
  const rows = db
    .prepare(`${PLAYER_SELECT} ORDER BY p.created_at DESC LIMIT ?`)
    .all(limit) as Record<string, unknown>[];
  return rows.map(mapPlayer);
}

export function generateLicenseId(): string {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `EG-${year}-`;
  const last = db
    .prepare(
      "SELECT license_id FROM players WHERE license_id LIKE ? ORDER BY license_id DESC LIMIT 1",
    )
    .get(`${prefix}%`) as { license_id: string } | undefined;

  let next = 1001;
  if (last?.license_id) {
    const num = Number(last.license_id.split("-").pop());
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function createPlayer(input: {
  fullName: string;
  birthdate: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  category: PlayerCategory;
  gameId: number;
  gameOther?: string | null;
  photoPath?: string | null;
  encodedBy: number;
}): Player {
  const db = getDb();
  const licenseId = generateLicenseId();
  const result = db
    .prepare(
      `INSERT INTO players (
        license_id, full_name, birthdate, email, phone, address,
        category, game_id, game_other, photo_path, status, encoded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'licensed', ?)`,
    )
    .run(
      licenseId,
      input.fullName,
      input.birthdate,
      input.email ?? null,
      input.phone ?? null,
      input.address ?? null,
      input.category,
      input.gameId,
      input.gameOther ?? null,
      input.photoPath ?? null,
      input.encodedBy,
    );

  const player = getPlayerById(Number(result.lastInsertRowid));
  if (!player) throw new Error("Failed to create player");
  return player;
}

export function getEncoderByUsername(username: string) {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, username, password_hash AS passwordHash, display_name AS displayName FROM encoders WHERE username = ?",
    )
    .get(username) as
    | {
        id: number;
        username: string;
        passwordHash: string;
        displayName: string;
      }
    | undefined;
}

export function getEncoderById(id: number) {
  const db = getDb();
  return db
    .prepare(
      "SELECT id, username, display_name AS displayName FROM encoders WHERE id = ?",
    )
    .get(id) as { id: number; username: string; displayName: string } | undefined;
}

export function countPlayers(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM players").get() as {
    count: number;
  };
  return row.count;
}
