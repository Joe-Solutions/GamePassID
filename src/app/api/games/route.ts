import { NextResponse } from "next/server";
import { listGames } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ games: await listGames() });
}
