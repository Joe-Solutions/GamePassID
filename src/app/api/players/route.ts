import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentEncoder } from "@/lib/auth";
import { createPlayer, getGameById, getUploadsDir, listPlayers } from "@/lib/db";
import {
  OTHERS_GAME_SLUG,
  type PlayerCategory,
  type PlayerStatus,
} from "@/lib/types";

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.enum(["casual", "amateur", "student"]),
  gameId: z.coerce.number().int().positive(),
  gameOther: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const gameId = searchParams.get("gameId");
  const category = searchParams.get("category") as PlayerCategory | null;
  const status = searchParams.get("status") as PlayerStatus | null;

  const players = listPlayers({
    q,
    gameId: gameId ? Number(gameId) : undefined,
    category: category || undefined,
    status: status || undefined,
  });

  return NextResponse.json({ players });
}

export async function POST(request: Request) {
  const encoder = await getCurrentEncoder();
  if (!encoder) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const parsed = createSchema.safeParse({
      fullName: form.get("fullName"),
      birthdate: form.get("birthdate"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      address: form.get("address") ?? "",
      category: form.get("category"),
      gameId: form.get("gameId"),
      gameOther: form.get("gameOther") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the registration fields." },
        { status: 400 },
      );
    }

    const game = getGameById(parsed.data.gameId);
    if (!game || !game.active) {
      return NextResponse.json({ error: "Selected game is invalid." }, { status: 400 });
    }

    const isOthers = game.slug === OTHERS_GAME_SLUG;
    const gameOther = parsed.data.gameOther?.trim() || "";
    if (isOthers && !gameOther) {
      return NextResponse.json(
        { error: "Please specify the other game." },
        { status: 400 },
      );
    }

    const photo = form.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { error: "Profile photo is required." },
        { status: 400 },
      );
    }

    if (!photo.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Profile photo must be an image." },
        { status: 400 },
      );
    }

    const uploadsDir = getUploadsDir();
    const filename = `${randomUUID()}.jpg`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const player = createPlayer({
      fullName: parsed.data.fullName,
      birthdate: parsed.data.birthdate,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      category: parsed.data.category,
      gameId: parsed.data.gameId,
      gameOther: isOthers ? gameOther : null,
      photoPath: filename,
      encodedBy: encoder.id,
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not register player." },
      { status: 500 },
    );
  }
}
