import { NextResponse } from "next/server";
import { logoutEncoder } from "@/lib/auth";

export async function POST() {
  await logoutEncoder();
  return NextResponse.json({ ok: true });
}
