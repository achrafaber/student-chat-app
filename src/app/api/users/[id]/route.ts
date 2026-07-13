import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        massarCode: users.massarCode,
        email: users.email,
        avatarColor: users.avatarColor,
        bio: users.bio,
        status: users.status,
        lastSeen: users.lastSeen,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Can only update own profile
    if (id !== session.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { name, bio, avatarColor, gender, status } = body;

    const [updated] = await db
      .update(users)
      .set({
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatarColor && { avatarColor }),
        ...(gender && { gender }),
        ...(status && { status, lastSeen: new Date() }),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        massarCode: updated.massarCode,
        email: updated.email,
        avatarColor: updated.avatarColor,
        bio: updated.bio,
        gender: updated.gender,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("User PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
