import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        massarCode: user.massarCode,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        bio: user.bio,
        gender: user.gender,
        status: user.status,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
