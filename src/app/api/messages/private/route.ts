import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateMessages, users } from "@/db/schema";
import { eq, or, and, sql, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Get conversations list
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get all messages involving the current user
    const allMessages = await db
      .select({
        id: privateMessages.id,
        senderId: privateMessages.senderId,
        receiverId: privateMessages.receiverId,
        content: privateMessages.content,
        read: privateMessages.read,
        createdAt: privateMessages.createdAt,
      })
      .from(privateMessages)
      .where(
        or(
          eq(privateMessages.senderId, session.id),
          eq(privateMessages.receiverId, session.id)
        )
      )
      .orderBy(desc(privateMessages.createdAt));

    // Get all users for lookup
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        avatarColor: users.avatarColor,
        massarCode: users.massarCode,
        status: users.status,
      })
      .from(users);

    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Group by conversation partner
    const conversationMap = new Map<
      string,
      {
        partnerId: string;
        partnerName: string;
        partnerAvatarColor: string;
        partnerMassarCode: string;
        lastMessage: string;
        lastMessageAt: Date;
        unread: number;
      }
    >();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === session.id ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        const partner = userMap.get(partnerId);
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: partner?.name || "Inconnu",
          partnerAvatarColor: partner?.avatarColor || "#8B5CF6",
          partnerMassarCode: partner?.massarCode || "",
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unread: 0,
        });
      }
    }

    // Count unread per sender
    const unreadCounts = await db
      .select({
        senderId: privateMessages.senderId,
        count: count(),
      })
      .from(privateMessages)
      .where(
        and(
          eq(privateMessages.receiverId, session.id),
          eq(privateMessages.read, false)
        )
      )
      .groupBy(privateMessages.senderId);

    for (const u of unreadCounts) {
      const conv = conversationMap.get(u.senderId);
      if (conv) {
        conv.unread = u.count;
      }
    }

    return NextResponse.json({
      conversations: Array.from(conversationMap.values()),
    });
  } catch (error) {
    console.error("Private messages GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Send private message
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "Destinataire et message requis" },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(privateMessages)
      .values({
        senderId: session.id,
        receiverId,
        content: content.trim(),
        read: false,
      })
      .returning();

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Private message POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
