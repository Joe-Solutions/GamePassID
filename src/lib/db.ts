import fs from "fs";
import path from "path";
import type {
  Game as PrismaGame,
  Player as PrismaPlayer,
  PlayerCategory as PrismaPlayerCategory,
  PlayerStatus as PrismaPlayerStatus,
} from "@/generated/prisma/client";
import { prisma } from "./prisma";
import type { Game, Player, PlayerCategory, PlayerStatus } from "./types";
import { OTHERS_GAME_SLUG } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads", "photos");

const GAME_ORDER: Record<string, number> = {
  "sim-racing": 1,
  "game-of-generals": 2,
  [OTHERS_GAME_SLUG]: 3,
};

type PlayerWithRelations = PrismaPlayer & {
  game: Pick<PrismaGame, "name" | "slug">;
  encoder: { displayName: string } | null;
};

function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

function mapGame(row: PrismaGame): Game {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: row.active,
  };
}

function mapPlayer(row: PlayerWithRelations): Player {
  return {
    id: row.id,
    licenseId: row.licenseId,
    fullName: row.fullName,
    birthdate: row.birthdate,
    email: row.email,
    phone: row.phone,
    address: row.address,
    category: row.category,
    gameId: row.gameId,
    gameName: row.game.name,
    gameSlug: row.game.slug,
    gameOther: row.gameOther,
    photoPath: row.photoPath,
    status: row.status,
    encodedBy: row.encodedBy,
    encoderName: row.encoder?.displayName ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

const playerInclude = {
  game: { select: { name: true, slug: true } },
  encoder: { select: { displayName: true } },
} as const;

export async function listGames(): Promise<Game[]> {
  const games = await prisma.game.findMany({
    where: { active: true },
  });

  return games
    .map(mapGame)
    .sort(
      (a, b) => (GAME_ORDER[a.slug] ?? 99) - (GAME_ORDER[b.slug] ?? 99),
    );
}

export async function getGameById(id: number): Promise<Game | null> {
  const game = await prisma.game.findUnique({ where: { id } });
  return game ? mapGame(game) : null;
}

export async function listPlayers(filters?: {
  q?: string;
  gameId?: number;
  category?: PlayerCategory;
  status?: PlayerStatus;
}): Promise<Player[]> {
  const q = filters?.q?.trim();

  const players = await prisma.player.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { licenseId: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { gameOther: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        filters?.gameId ? { gameId: filters.gameId } : {},
        filters?.category
          ? { category: filters.category as PrismaPlayerCategory }
          : {},
        filters?.status
          ? { status: filters.status as PrismaPlayerStatus }
          : {},
      ],
    },
    include: playerInclude,
    orderBy: { createdAt: "desc" },
  });

  return players.map(mapPlayer);
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const player = await prisma.player.findUnique({
    where: { id },
    include: playerInclude,
  });
  return player ? mapPlayer(player) : null;
}

export async function getPlayerByLicenseId(
  licenseId: string,
): Promise<Player | null> {
  const player = await prisma.player.findFirst({
    where: {
      licenseId: { equals: licenseId.trim(), mode: "insensitive" },
    },
    include: playerInclude,
  });
  return player ? mapPlayer(player) : null;
}

export async function findPlayerByNameAndBirthdate(
  fullName: string,
  birthdate: string,
): Promise<Player | null> {
  const player = await prisma.player.findFirst({
    where: {
      fullName: { equals: fullName.trim(), mode: "insensitive" },
      birthdate,
    },
    include: playerInclude,
    orderBy: { createdAt: "desc" },
  });
  return player ? mapPlayer(player) : null;
}

export async function getRecentPlayers(limit = 8): Promise<Player[]> {
  const players = await prisma.player.findMany({
    include: playerInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return players.map(mapPlayer);
}

export async function generateLicenseId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EG-${year}-`;
  const last = await prisma.player.findFirst({
    where: { licenseId: { startsWith: prefix } },
    orderBy: { licenseId: "desc" },
    select: { licenseId: true },
  });

  let next = 1001;
  if (last?.licenseId) {
    const num = Number(last.licenseId.split("-").pop());
    if (!Number.isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createPlayer(input: {
  fullName: string;
  birthdate: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  category: PlayerCategory;
  gameId: number;
  gameOther?: string | null;
  photoPath?: string | null;
  encodedBy?: number | null;
}): Promise<Player> {
  const licenseId = await generateLicenseId();
  const player = await prisma.player.create({
    data: {
      licenseId,
      fullName: input.fullName,
      birthdate: input.birthdate,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      category: input.category,
      gameId: input.gameId,
      gameOther: input.gameOther ?? null,
      photoPath: input.photoPath ?? null,
      status: "registered",
      encodedBy: input.encodedBy ?? null,
    },
    include: playerInclude,
  });

  return mapPlayer(player);
}

export async function updatePlayer(
  id: number,
  input: {
    fullName: string;
    birthdate: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    category: PlayerCategory;
    gameId: number;
    gameOther?: string | null;
    photoPath?: string | null;
    status?: PlayerStatus;
  },
): Promise<Player | null> {
  try {
    const player = await prisma.player.update({
      where: { id },
      data: {
        fullName: input.fullName,
        birthdate: input.birthdate,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        category: input.category,
        gameId: input.gameId,
        gameOther: input.gameOther ?? null,
        ...(input.photoPath !== undefined ? { photoPath: input.photoPath } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      include: playerInclude,
    });
    return mapPlayer(player);
  } catch {
    return null;
  }
}

export async function setPlayerStatus(
  id: number,
  status: PlayerStatus,
): Promise<Player | null> {
  try {
    const player = await prisma.player.update({
      where: { id },
      data: { status },
      include: playerInclude,
    });
    return mapPlayer(player);
  } catch {
    return null;
  }
}

export async function deletePlayer(id: number): Promise<{
  deleted: boolean;
  photoPath: string | null;
}> {
  try {
    const existing = await prisma.player.findUnique({
      where: { id },
      select: { photoPath: true },
    });
    if (!existing) return { deleted: false, photoPath: null };

    await prisma.player.delete({ where: { id } });
    return { deleted: true, photoPath: existing.photoPath };
  } catch {
    return { deleted: false, photoPath: null };
  }
}

export async function getEncoderByUsername(username: string) {
  return prisma.encoder.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      displayName: true,
    },
  });
}

export async function getEncoderById(id: number) {
  return prisma.encoder.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  });
}

export async function countPlayers(): Promise<number> {
  return prisma.player.count();
}
