import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentEncoder } from "@/lib/auth";
import { setPlayerStatus } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  status: z.enum(["registered", "licensed", "inactive"]),
});

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

  try {
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const player = await setPlayerStatus(playerId, parsed.data.status);
    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    return NextResponse.json({ player });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Could not update player status." },
      { status: 500 },
    );
  }
}
