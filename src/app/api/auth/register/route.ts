import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createToken, setSessionOnResponse } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { massarCode, name, email, password, gender } = body;

    if (!massarCode || !name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Check if massar code already exists
    const [existingMassar] = await db
      .select()
      .from(users)
      .where(eq(users.massarCode, massarCode))
      .limit(1);

    if (existingMassar) {
      return NextResponse.json(
        { error: "Ce Code Massar est déjà enregistré" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const avatarColors = ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#6366F1", "#14B8A6"];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const [user] = await db
      .insert(users)
      .values({
        massarCode,
        name,
        email,
        passwordHash,
        avatarColor,
        bio: "",
        gender: gender || "other",
        status: "online",
      })
      .returning();

    const token = await createToken({
      id: user.id,
      massarCode: user.massarCode,
      name: user.name,
      email: user.email,
    });

    const userData = {
      id: user.id,
      massarCode: user.massarCode,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      bio: user.bio,
      status: user.status,
    };

    const response = NextResponse.json({ user: userData });
    return setSessionOnResponse(response, token);
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
