import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createPlayer, getGameById, getUploadsDir } from "@/lib/db";
import { OTHERS_GAME_SLUG } from "@/lib/types";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  gameId: z.coerce.number().int().positive(),
  gameOther: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const parsed = registerSchema.safeParse({
      fullName: form.get("fullName"),
      birthdate: form.get("birthdate"),
      email: form.get("email") ?? "",
      phone: form.get("phone") ?? "",
      address: form.get("address") ?? "",
      gameId: form.get("gameId"),
      gameOther: form.get("gameOther") ?? "",
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

    const player = await createPlayer({
      fullName: parsed.data.fullName,
      birthdate: parsed.data.birthdate,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      category: "casual",
      gameId: parsed.data.gameId,
      gameOther: isOthers ? gameOther : null,
      photoPath: filename,
      encodedBy: null,
    });

    return NextResponse.json({ player }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not complete registration." },
      { status: 500 },
    );
  }
}
