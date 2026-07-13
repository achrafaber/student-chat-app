import { NextResponse } from "next/server";
import { db } from "@/db";
import { privateMessages, users } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Get conversation with specific user
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { userId } = await params;

    // Mark messages as read
    await db
      .update(privateMessages)
      .set({ read: true })
      .where(
        and(
          eq(privateMessages.senderId, userId),
          eq(privateMessages.receiverId, session.id),
          eq(privateMessages.read, false)
        )
      );

    // Get messages between the two users
    const msgs = await db
      .select()
      .from(privateMessages)
      .where(
        or(
          and(
            eq(privateMessages.senderId, session.id),
            eq(privateMessages.receiverId, userId)
          ),
          and(
            eq(privateMessages.senderId, userId),
            eq(privateMessages.receiverId, session.id)
          )
        )
      )
      .orderBy(desc(privateMessages.createdAt))
      .limit(100);

    msgs.reverse();

    // Get partner info
    const [partner] = await db
      .select({
        id: users.id,
        name: users.name,
        massarCode: users.massarCode,
        avatarColor: users.avatarColor,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({
      messages: msgs,
      partner: partner || null,
    });
  } catch (error) {
    console.error("Private conversation GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
