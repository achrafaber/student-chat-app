import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "massar-chat-secret-key-2024"
);

export interface SessionUser {
  id: string;
  massarCode: string;
  name: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    return user || null;
  } catch {
    return null;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Disable Secure to work in all environments (preview, HTTP, HTTPS)
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

/** Set session cookie on a NextResponse object — this is the reliable way */
export function setSessionOnResponse(response: NextResponse, token: string) {
  response.cookies.set("session", token, COOKIE_OPTIONS);
  return response;
}

/** Clear session cookie on a NextResponse object */
export function clearSessionOnResponse(response: NextResponse) {
  response.cookies.delete("session");
  return response;
}
