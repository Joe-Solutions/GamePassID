import { NextResponse } from "next/server";
import { loginEncoder } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const encoder = await loginEncoder(username, password);
    if (!encoder) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    return NextResponse.json({ encoder });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
