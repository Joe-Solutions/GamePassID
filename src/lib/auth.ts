import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getEncoderById, getEncoderByUsername } from "./db";
import type { Encoder } from "./types";

const COOKIE_NAME = "rh_encoder_session";
const SESSION_DAYS = 7;

function getSecret() {
  return process.env.AUTH_SECRET || "registration-hub-dev-secret-change-me";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encodeSession(encoderId: number, expiresAt: number): string {
  const payload = `${encoderId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): { encoderId: number; expiresAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [idStr, expStr, signature] = parts;
  const payload = `${idStr}.${expStr}`;
  if (sign(payload) !== signature) return null;
  const encoderId = Number(idStr);
  const expiresAt = Number(expStr);
  if (!encoderId || !expiresAt || Date.now() > expiresAt) return null;
  return { encoderId, expiresAt };
}

export async function loginEncoder(
  username: string,
  password: string,
): Promise<Encoder | null> {
  const encoder = getEncoderByUsername(username.trim());
  if (!encoder) return null;
  const ok = await bcrypt.compare(password, encoder.passwordHash);
  if (!ok) return null;

  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = encodeSession(encoder.id, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });

  return {
    id: encoder.id,
    username: encoder.username,
    displayName: encoder.displayName,
  };
}

export async function logoutEncoder() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentEncoder(): Promise<Encoder | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = decodeSession(token);
  if (!session) return null;
  const encoder = getEncoderById(session.encoderId);
  return encoder ?? null;
}

export async function requireEncoder(): Promise<Encoder> {
  const encoder = await getCurrentEncoder();
  if (!encoder) {
    throw new Error("UNAUTHORIZED");
  }
  return encoder;
}
