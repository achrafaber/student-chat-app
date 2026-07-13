import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";

const userFields = {
  id: users.id,
  name: users.name,
  massarCode: users.massarCode,
  avatarColor: users.avatarColor,
  gender: users.gender,
  status: users.status,
  bio: users.bio,
};

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const url = new URL(request.url);
    const search = url.searchParams.get("q") || "";

    let result;
    if (search) {
      result = await db
        .select(userFields)
        .from(users)
        .where(or(ilike(users.name, `%${search}%`), ilike(users.massarCode, `%${search}%`)))
        .limit(20);
    } else {
      result = await db.select(userFields).from(users).limit(20);
    }

    const filtered = result.filter((u) => u.id !== session.id);
    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
