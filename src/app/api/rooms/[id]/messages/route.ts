import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, users, roomMembers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const roomMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        type: messages.type,
        textColor: messages.textColor,
        textFormat: messages.textFormat,
        textSize: messages.textSize,
        createdAt: messages.createdAt,
        userId: messages.userId,
        userName: users.name,
        userAvatarColor: users.avatarColor,
        userGender: users.gender,
        userMassarCode: users.massarCode,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.roomId, id))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    roomMessages.reverse();

    return NextResponse.json({ messages: roomMessages });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { content, textColor, textFormat, textSize } = body;

    if (!content?.trim()) return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });

    const [membership] = await db
      .select().from(roomMembers)
      .where(sql`${roomMembers.roomId} = ${id} AND ${roomMembers.userId} = ${session.id}`)
      .limit(1);

    if (!membership) return NextResponse.json({ error: "Vous devez rejoindre ce salon" }, { status: 403 });

    // Check for /me action command (MSN Messenger style)
    let msgType: "text" | "action" = "text";
    let msgContent = content.trim();
    if (msgContent.startsWith("/me ")) {
      msgType = "action";
      msgContent = msgContent.substring(4);
    }

    const [message] = await db
      .insert(messages)
      .values({
        roomId: id,
        userId: session.id,
        content: msgContent,
        type: msgType,
        textColor: textColor || "default",
        textFormat: textFormat || "normal",
        textSize: textSize || "md",
      })
      .returning();

    return NextResponse.json({
      message: {
        ...message,
        userName: session.name,
        userGender: "other",
        userMassarCode: session.massarCode,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
