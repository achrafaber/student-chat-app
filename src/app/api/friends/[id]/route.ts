import { NextResponse } from "next/server";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Accept or reject friend request
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
    const { action } = body; // "accept" or "reject"

    if (!action) {
      return NextResponse.json({ error: "Action requise" }, { status: 400 });
    }

    if (action === "accept") {
      await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(eq(friendships.id, id));
    } else if (action === "reject") {
      await db.delete(friendships).where(eq(friendships.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend PUT error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Remove friend
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
    await db.delete(friendships).where(eq(friendships.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Friend DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
