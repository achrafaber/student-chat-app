import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, chatRooms, roomMembers, messages, privateMessages, friendships } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    // Check if already seeded
    const [existing] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
    if (existing.count > 0) {
      return NextResponse.json({ message: "Already seeded", count: existing.count });
    }

    const passwordHash = await hashPassword("password123");

    // Create demo users
    const demoUsers = await db.insert(users).values([
      { massarCode: "M20240001", name: "Youssef Amrani", email: "youssef@massar.ma", passwordHash, avatarColor: "#8B5CF6", bio: "Étudiant en informatique, passionné de développement web 🖥️", status: "online", gender: "male" },
      { massarCode: "M20240002", name: "Fatima Zahra Bennis", email: "fatima@massar.ma", passwordHash, avatarColor: "#EC4899", bio: "Amoureuse de la littérature et des arts 📚", status: "online", gender: "female" },
      { massarCode: "M20240003", name: "Ahmed Tazi", email: "ahmed@massar.ma", passwordHash, avatarColor: "#3B82F6", bio: "Futur ingénieur, fan de football ⚽", status: "away", gender: "male" },
      { massarCode: "M20240004", name: "Khadija El Fassi", email: "khadija@massar.ma", passwordHash, avatarColor: "#10B981", bio: "Étudiante en médecine, toujours optimiste 😊", status: "online", gender: "female" },
      { massarCode: "M20240005", name: "Omar Chraibi", email: "omar@massar.ma", passwordHash, avatarColor: "#F59E0B", bio: "Passionné de musique et de guitare 🎸", status: "offline", gender: "male" },
      { massarCode: "M20240006", name: "Salma Idrissi", email: "salma@massar.ma", passwordHash, avatarColor: "#EF4444", bio: "Future architecte, créative et curieuse 🎨", status: "online", gender: "female" },
      { massarCode: "M20240007", name: "Rachid Bouzid", email: "rachid@massar.ma", passwordHash, avatarColor: "#6366F1", bio: "Mathématicien en herbe 🧮", status: "away", gender: "male" },
      { massarCode: "M20240008", name: "Nadia Alaoui", email: "nadia@massar.ma", passwordHash, avatarColor: "#14B8A6", bio: "Journalisme et communication 📰", status: "online", gender: "female" },
    ]).returning();

    // Create chat rooms
    const demoRooms = await db.insert(chatRooms).values([
      { name: "Salon Général", description: "Le salon principal pour discuter de tout et de rien !", icon: "💬", category: "general", createdBy: demoUsers[0].id, isPrivate: false, maxMembers: 100 },
      { name: "Aide aux Devoirs", description: "Besoin d'aide pour vos devoirs ? C'est ici ! 📝", icon: "📚", category: "study", createdBy: demoUsers[1].id, isPrivate: false, maxMembers: 50 },
      { name: "Informatique & Code", description: "Discussions tech, programmation et nouvelles technologies", icon: "💻", category: "tech", createdBy: demoUsers[0].id, isPrivate: false, maxMembers: 50 },
      { name: "Café Philosophique", description: "Débats, réflexions et discussions profondes", icon: "☕", category: "culture", createdBy: demoUsers[2].id, isPrivate: false, maxMembers: 30 },
      { name: "Sport & Bien-être", description: "Pour les amateurs de sport et de vie saine", icon: "⚽", category: "sports", createdBy: demoUsers[2].id, isPrivate: false, maxMembers: 40 },
      { name: "Détente & Fun", description: "Blagues, jeux et bonne humeur ! 😄", icon: "🎮", category: "fun", createdBy: demoUsers[4].id, isPrivate: false, maxMembers: 60 },
      { name: "Préparation Examens", description: "Groupe de révision et motivation mutuelle", icon: "🎯", category: "study", createdBy: demoUsers[3].id, isPrivate: true, maxMembers: 20 },
      { name: "Musique & Arts", description: "Partagez vos découvertes musicales et artistiques", icon: "🎵", category: "culture", createdBy: demoUsers[4].id, isPrivate: false, maxMembers: 40 },
    ]).returning();

    // Add members to rooms
    const memberEntries: typeof roomMembers.$inferInsert[] = [];
    for (const room of demoRooms) {
      // Add 4-6 random members to each room
      const numMembers = 4 + Math.floor(Math.random() * 3);
      const shuffled = [...demoUsers].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numMembers && i < shuffled.length; i++) {
        memberEntries.push({
          roomId: room.id,
          userId: shuffled[i].id,
          role: i === 0 ? "owner" : "member",
        });
      }
    }
    await db.insert(roomMembers).values(memberEntries);

    // Create messages for each room
    const messageData: typeof messages.$inferInsert[] = [];
    const sampleMessages = [
      "Salut tout le monde ! 👋",
      "Comment ça va aujourd'hui ?",
      "Quelqu'un a compris le cours de maths ? 😅",
      "Je suis prêt pour les examens ! 💪",
      "Qui veut réviser ensemble ce soir ?",
      "Bonne journée à tous ! ☀️",
      "C'est cool ce salon !",
      "Quelqu'un a les notes du dernier contrôle ?",
      "La cafeteria est fermée aujourd'hui 😭",
      "Vive les vacances ! 🎉",
      "Je recommande ce cours en ligne, c'est super !",
      "On se retrouve à la bibliothèque ?",
      "C'est quand le prochain examen ?",
      "Merci pour l'aide ! 🙏",
      "Qui est connecté ce soir ?",
      "Bonne chance pour les exams ! 🍀",
      "J'adore cette ambiance 😊",
      "Quelqu'un a le lien du cours ?",
      "Pizza ce midi ? 🍕",
      "N'oubliez pas le devoir de demain !",
    ];

    for (const room of demoRooms) {
      const numMessages = 8 + Math.floor(Math.random() * 12);
      for (let i = 0; i < numMessages; i++) {
        const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
        const randomMessage = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        const hoursAgo = Math.floor(Math.random() * 48);
        const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
        messageData.push({
          roomId: room.id,
          userId: randomUser.id,
          content: randomMessage,
          type: "text",
          createdAt,
        });
      }
    }
    await db.insert(messages).values(messageData);

    // Create some friendships
    await db.insert(friendships).values([
      { userId: demoUsers[0].id, friendId: demoUsers[1].id, status: "accepted" },
      { userId: demoUsers[0].id, friendId: demoUsers[2].id, status: "accepted" },
      { userId: demoUsers[1].id, friendId: demoUsers[3].id, status: "accepted" },
      { userId: demoUsers[2].id, friendId: demoUsers[4].id, status: "accepted" },
      { userId: demoUsers[3].id, friendId: demoUsers[5].id, status: "accepted" },
      { userId: demoUsers[0].id, friendId: demoUsers[3].id, status: "accepted" },
      { userId: demoUsers[4].id, friendId: demoUsers[6].id, status: "accepted" },
      { userId: demoUsers[5].id, friendId: demoUsers[7].id, status: "accepted" },
      { userId: demoUsers[6].id, friendId: demoUsers[0].id, status: "pending" },
      { userId: demoUsers[7].id, friendId: demoUsers[1].id, status: "pending" },
    ]);

    // Create some private messages
    const pmData: typeof privateMessages.$inferInsert[] = [
      { senderId: demoUsers[0].id, receiverId: demoUsers[1].id, content: "Hey Fatima ! Tu as pu finir le devoir ?", read: true },
      { senderId: demoUsers[1].id, receiverId: demoUsers[0].id, content: "Oui, je t'envoie mes notes ce soir 👍", read: true },
      { senderId: demoUsers[0].id, receiverId: demoUsers[1].id, content: "Super, merci beaucoup ! 🙏", read: true },
      { senderId: demoUsers[2].id, receiverId: demoUsers[3].id, content: "Khadija, on se voit à la biblio ?", read: true },
      { senderId: demoUsers[3].id, receiverId: demoUsers[2].id, content: "Oui, à 14h ! 📚", read: false },
      { senderId: demoUsers[4].id, receiverId: demoUsers[5].id, content: "Tu joues de la guitare ce soir ? 🎸", read: false },
      { senderId: demoUsers[6].id, receiverId: demoUsers[7].id, content: "Nadia, as-tu vu le dernier article ?", read: true },
      { senderId: demoUsers[7].id, receiverId: demoUsers[6].id, content: "Pas encore, envoie-moi le lien !", read: false },
    ];
    await db.insert(privateMessages).values(pmData);

    // Create demo mail
    const { mail: mailTable } = await import("@/db/schema");
    await db.insert(mailTable).values([
      { senderId: demoUsers[1].id, receiverId: demoUsers[0].id, subject: "Notes du cours de Maths 📐", body: "Salut Youssef !\n\nVoici les notes du cours de maths d'aujourd'hui. J'ai pris beaucoup de notes surtout sur les intégrales.\n\nBon courage pour les révisions !\n\nFatima Zahra 💕", read: false },
      { senderId: demoUsers[2].id, receiverId: demoUsers[0].id, subject: "Match de foot demain ⚽", body: "Hey ! On fait un match demain à 17h au terrain du quartier ? On est déjà 8, il nous manque un gardien !\n\nAhmed", read: false },
      { senderId: demoUsers[0].id, receiverId: demoUsers[3].id, subject: "Projet de groupe", body: "Bonjour Khadija,\n\nEs-tu disponible ce week-end pour travailler sur le projet de groupe ? On pourrait se retrouver à la bibliothèque.\n\nYoussef", read: true },
      { senderId: demoUsers[7].id, receiverId: demoUsers[5].id, subject: "Article sur l'architecture 🏛️", body: "Salma ! J'ai trouvé un article incroyable sur l'architecture moderne au Maroc. Tu dois absolument le lire !\n\nNadia 📰", read: true },
      { senderId: demoUsers[4].id, receiverId: demoUsers[0].id, subject: "Nouvelle chanson 🎵", body: "J'ai écrit une nouvelle chanson, viens l'écouter quand tu peux ! 🎸\n\nOmar", read: false, starred: true },
    ]);

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      stats: {
        users: demoUsers.length,
        rooms: demoRooms.length,
        messages: messageData.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Erreur lors du seeding" }, { status: 500 });
  }
}
