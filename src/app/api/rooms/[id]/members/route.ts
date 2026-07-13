import { NextResponse } from "next/server";
import { db } from "@/db";
import { roomMembers, chatRooms, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;

    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id)).limit(1);
    if (!room) return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });

    // Check if room is private and requires a code
    if (room.isPrivate && room.joinCode) {
      const body = await request.json();
      const { joinCode } = body;
      if (joinCode !== room.joinCode) {
        return NextResponse.json({ error: "Code d'accès incorrect" }, { status: 403 });
      }
    }

    const [existing] = await db
      .select().from(roomMembers)
      .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${session.id}`)
      .limit(1);

    if (existing) return NextResponse.json({ error: "Déjà membre" }, { status: 409 });

    await db.insert(roomMembers).values({ roomId: id, userId: session.id, role: "member" });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { kickUserId } = body;

    // If kickUserId is provided, owner is kicking someone
    if (kickUserId) {
      const [myMembership] = await db.select().from(roomMembers)
        .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${session.id}`)
        .limit(1);

      if (!myMembership || myMembership.role !== "owner") {
        return NextResponse.json({ error: "Seul le propriétaire peut exclure un membre" }, { status: 403 });
      }

      // Can't kick the owner
      const [targetMembership] = await db.select().from(roomMembers)
        .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${kickUserId}`)
        .limit(1);

      if (!targetMembership) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
      if (targetMembership.role === "owner") return NextResponse.json({ error: "Impossible d'exclure le propriétaire" }, { status: 403 });

      await db.delete(roomMembers)
        .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${kickUserId}`);

      return NextResponse.json({ success: true });
    }

    // Otherwise, user is leaving the room
    await db.delete(roomMembers)
      .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${session.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Member DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
