import { NextResponse } from "next/server";
import { db } from "@/db";
import { mail, users } from "@/db/schema";
import { eq, or, and, desc, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const allMail = await db
      .select()
      .from(mail)
      .where(eq(mail.receiverId, session.id))
      .orderBy(desc(mail.createdAt));

    const allUsers = await db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor, massarCode: users.massarCode }).from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const enriched = allMail.map((m) => ({
      ...m,
      senderName: userMap.get(m.senderId)?.name || "Inconnu",
      senderAvatarColor: userMap.get(m.senderId)?.avatarColor || "#8B5CF6",
      senderMassarCode: userMap.get(m.senderId)?.massarCode || "",
    }));

    const [unreadRow] = await db
      .select({ count: count() })
      .from(mail)
      .where(and(eq(mail.receiverId, session.id), eq(mail.read, false)));
    const unreadCount = unreadRow?.count || 0;

    return NextResponse.json({ mail: enriched, unreadCount });
  } catch (error) {
    console.error("Mail GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { receiverId, subject, body: mailBody } = body;

    if (!receiverId || !subject?.trim() || !mailBody?.trim()) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const [newMail] = await db
      .insert(mail)
      .values({ senderId: session.id, receiverId, subject: subject.trim(), body: mailBody.trim() })
      .returning();

    return NextResponse.json({ mail: newMail }, { status: 201 });
  } catch (error) {
    console.error("Mail POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
