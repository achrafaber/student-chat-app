import { NextResponse } from "next/server";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

// Get friends list
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get all users for lookup
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    // Get all friendships involving the current user
    const allFriendships = await db
      .select()
      .from(friendships)
      .where(
        or(
          eq(friendships.userId, session.id),
          eq(friendships.friendId, session.id)
        )
      );

    // Categorize friendships
    const accepted: Array<{
      id: string;
      friendId: string;
      userId: string;
      friendName: string;
      friendAvatarColor: string;
      friendMassarCode: string;
      friendStatus: string;
      createdAt: Date;
    }> = [];

    const pendingReceived: Array<{
      id: string;
      userId: string;
      userName: string;
      userAvatarColor: string;
      userMassarCode: string;
      createdAt: Date;
    }> = [];

    const pendingSent: Array<{
      id: string;
      friendId: string;
      friendName: string;
      friendAvatarColor: string;
      createdAt: Date;
    }> = [];

    for (const f of allFriendships) {
      if (f.status === "accepted") {
        // Determine which user is the friend
        const friendId = f.userId === session.id ? f.friendId : f.userId;
        const friend = userMap.get(friendId);
        if (friend) {
          accepted.push({
            id: f.id,
            friendId,
            userId: f.userId,
            friendName: friend.name,
            friendAvatarColor: friend.avatarColor || "#8B5CF6",
            friendMassarCode: friend.massarCode,
            friendStatus: friend.status || "offline",
            createdAt: f.createdAt,
          });
        }
      } else if (f.status === "pending") {
        if (f.friendId === session.id) {
          // Request received
          const sender = userMap.get(f.userId);
          if (sender) {
            pendingReceived.push({
              id: f.id,
              userId: f.userId,
              userName: sender.name,
              userAvatarColor: sender.avatarColor || "#8B5CF6",
              userMassarCode: sender.massarCode,
              createdAt: f.createdAt,
            });
          }
        } else if (f.userId === session.id) {
          // Request sent
          const receiver = userMap.get(f.friendId);
          if (receiver) {
            pendingSent.push({
              id: f.id,
              friendId: f.friendId,
              friendName: receiver.name,
              friendAvatarColor: receiver.avatarColor || "#8B5CF6",
              createdAt: f.createdAt,
            });
          }
        }
      }
    }

    return NextResponse.json({
      friends: accepted,
      pendingReceived,
      pendingSent,
    });
  } catch (error) {
    console.error("Friends GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Send friend request
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: "ID ami requis" }, { status: 400 });
    }

    if (friendId === session.id) {
      return NextResponse.json({ error: "Impossible de s'ajouter soi-même" }, { status: 400 });
    }

    // Check if friendship already exists
    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.userId, session.id),
            eq(friendships.friendId, friendId)
          ),
          and(
            eq(friendships.userId, friendId),
            eq(friendships.friendId, session.id)
          )
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });
    }

    await db.insert(friendships).values({
      userId: session.id,
      friendId,
      status: "pending",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Friend request POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
