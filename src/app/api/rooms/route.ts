import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatRooms, roomMembers, messages, users } from "@/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get all rooms
    const allRooms = await db
      .select()
      .from(chatRooms)
      .orderBy(desc(chatRooms.createdAt));

    // Get member counts per room
    const memberCounts = await db
      .select({
        roomId: roomMembers.roomId,
        count: count(),
      })
      .from(roomMembers)
      .groupBy(roomMembers.roomId);

    const countMap = new Map(memberCounts.map((m) => [m.roomId, m.count]));

    // Get last message time per room
    const lastMsgTimes = await db
      .select({
        roomId: messages.roomId,
        lastAt: sql<Date>`MAX(${messages.createdAt})`,
      })
      .from(messages)
      .groupBy(messages.roomId);

    const lastMsgMap = new Map(lastMsgTimes.map((m) => [m.roomId, m.lastAt]));

    // Check membership for current user
    const myMemberships = await db
      .select({ roomId: roomMembers.roomId })
      .from(roomMembers)
      .where(eq(roomMembers.userId, session.id));

    const memberSet = new Set(myMemberships.map((m) => m.roomId));

    const rooms = allRooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      icon: room.icon,
      category: room.category,
      isPrivate: room.isPrivate,
      joinCode: room.joinCode,
      maxMembers: room.maxMembers,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      memberCount: countMap.get(room.id) || 0,
      lastMessageAt: lastMsgMap.get(room.id) || null,
      isMember: memberSet.has(room.id),
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Rooms GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, category, isPrivate, joinCode, maxMembers } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du salon est requis" },
        { status: 400 }
      );
    }

    const [room] = await db
      .insert(chatRooms)
      .values({
        name,
        description: description || "",
        icon: icon || "💬",
        category: category || "general",
        isPrivate: isPrivate || false,
        joinCode: isPrivate ? (joinCode || null) : null,
        maxMembers: maxMembers || 50,
        createdBy: session.id,
      })
      .returning();

    // Auto-join creator as owner
    await db.insert(roomMembers).values({
      roomId: room.id,
      userId: session.id,
      role: "owner",
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Rooms POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
