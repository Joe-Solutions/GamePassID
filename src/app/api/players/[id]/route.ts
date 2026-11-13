import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getCurrentEncoder } from "@/lib/auth";
import {
  deletePlayer,
  getGameById,
  getPlayerById,
  getUploadsDir,
  updatePlayer,
} from "@/lib/db";
import { OTHERS_GAME_SLUG } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  category: z.enum(["casual", "amateur", "student"]),
  gameId: z.coerce.number().int().positive(),
  gameOther: z.string().trim().max(120).optional().or(z.literal("")),
  status: z.enum(["licensed", "inactive"]).optional(),
});

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const playerId = Number(id);
  if (!playerId) {
    return NextResponse.json({ error: "Invalid player." }, { status: 400 });
  }

  const player = await getPlayerById(playerId);
  if (!player) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  return NextResponse.json({ player });
}

export async function PATCH(request: Request, { params }: Params) {
  const encoder = await getCurrentEncoder();
  if (!encoder) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!playerId) {
    return NextResponse.json({ error: "Invalid player." }, { status: 400 });
  }

  const existing = await getPlayerById(playerId);
  if (!existing) {
    return NextResponse.json({ error: "Player not found." }, { status: 404 });
  }

  try {
    const form = await request.formData();
    const parsed = updateSchema.safeParse({
      fullName: form.get("fullName"),
      birthdate: form.get("birthdate"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      address: form.get("address") ?? "",
      category: form.get("category"),
      gameId: form.get("gameId"),
      gameOther: form.get("gameOther") ?? "",
      status: form.get("status") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the registration fields." },
        { status: 400 },
      );
    }

    const game = await getGameById(parsed.data.gameId);
    if (!game || !game.active) {
      return NextResponse.json(
        { error: "Selected game is invalid." },
        { status: 400 },
      );
    }

    const isOthers = game.slug === OTHERS_GAME_SLUG;
    const gameOther = parsed.data.gameOther?.trim() || "";
    if (isOthers && !gameOther) {
      return NextResponse.json(
        { error: "Please specify the other game." },
        { status: 400 },
      );
    }

    let photoPath: string | undefined;
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) {
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
      photoPath = filename;

      if (existing.photoPath) {
        const oldPath = path.join(uploadsDir, existing.photoPath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const player = await updatePlayer(playerId, {
      fullName: parsed.data.fullName,
      birthdate: parsed.data.birthdate,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      category: parsed.data.category,
      gameId: parsed.data.gameId,
      gameOther: isOthers ? gameOther : null,
      photoPath,
      status: parsed.data.status,
    });

    if (!player) {
      return NextResponse.json(
        { error: "Could not update player." },
        { status: 500 },
      );
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not update player." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const encoder = await getCurrentEncoder();
  if (!encoder) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const playerId = Number(id);
  if (!playerId) {
    return NextResponse.json({ error: "Invalid player." }, { status: 400 });
  }

  try {
    const result = await deletePlayer(playerId);
    if (!result.deleted) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    if (result.photoPath) {
      const filePath = path.join(getUploadsDir(), result.photoPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not delete player." },
      { status: 500 },
    );
  }
}
