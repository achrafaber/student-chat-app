import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, clearSessionOnResponse } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await db
        .update(users)
        .set({ status: "offline", lastSeen: new Date() })
        .where(eq(users.id, session.id));
    }
    const response = NextResponse.json({ success: true });
    return clearSessionOnResponse(response);
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
