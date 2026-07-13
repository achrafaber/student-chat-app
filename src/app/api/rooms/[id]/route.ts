import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatRooms, roomMembers, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, id))
      .limit(1);

    if (!room) {
      return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
    }

    // Get members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        massarCode: users.massarCode,
        avatarColor: users.avatarColor,
        gender: users.gender,
        status: users.status,
        role: roomMembers.role,
        joinedAt: roomMembers.joinedAt,
      })
      .from(roomMembers)
      .innerJoin(users, eq(roomMembers.userId, users.id))
      .where(eq(roomMembers.roomId, id));

    // Check if user is member
    const [membership] = await db
      .select()
      .from(roomMembers)
      .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${session.id}`)
      .limit(1);

    return NextResponse.json({
      room: { ...room, joinCode: room.isPrivate ? room.joinCode : null, isMember: !!membership },
      members,
    });
  } catch (error) {
    console.error("Room GET error:", error);
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
    const body = await request.json();
    const { name, description, icon, category } = body;

    const [room] = await db
      .update(chatRooms)
      .set({ name, description, icon, category })
      .where(eq(chatRooms.id, id))
      .returning();

    if (!room) {
      return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Room PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(chatRooms).where(eq(chatRooms.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Room DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
