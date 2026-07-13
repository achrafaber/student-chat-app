import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createToken, setSessionOnResponse } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { massarCode, password } = body;

    if (!massarCode || !password) {
      return NextResponse.json(
        { error: "Code Massar et mot de passe requis" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.massarCode, massarCode))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Code Massar ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Code Massar ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Update status to online
    await db
      .update(users)
      .set({ status: "online", lastSeen: new Date() })
      .where(eq(users.id, user.id));

    const token = await createToken({
      id: user.id,
      massarCode: user.massarCode,
      name: user.name,
      email: user.email,
    });

    const userData = {
      id: user.id,
      massarCode: user.massarCode,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      bio: user.bio,
      status: "online" as const,
    };

    const response = NextResponse.json({ user: userData });
    return setSessionOnResponse(response, token);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
