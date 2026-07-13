import { NextResponse } from "next/server";
import { db } from "@/db";
import { mail } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // "read", "star", "unstar"

    if (action === "read") {
      await db.update(mail).set({ read: true }).where(eq(mail.id, id));
    } else if (action === "star") {
      await db.update(mail).set({ starred: true }).where(eq(mail.id, id));
    } else if (action === "unstar") {
      await db.update(mail).set({ starred: false }).where(eq(mail.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mail PUT error:", error);
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
    await db.delete(mail).where(eq(mail.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mail DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
