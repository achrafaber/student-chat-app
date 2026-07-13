import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────
export const userStatusEnum = pgEnum("user_status", ["online", "offline", "away", "busy"]);
export const userGenderEnum = pgEnum("user_gender", ["male", "female", "other"]);
export const roomCategoryEnum = pgEnum("room_category", [
  "general",
  "study",
  "fun",
  "tech",
  "culture",
  "sports",
]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member"]);
export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "blocked",
]);
export const messageTypeEnum = pgEnum("message_type", ["text", "system", "action"]);

// ─── Tables ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  massarCode: varchar("massar_code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  avatarColor: varchar("avatar_color", { length: 7 }).default("#8B5CF6"),
  bio: text("bio").default(""),
  gender: userGenderEnum("gender").default("other"),
  status: userStatusEnum("status").default("offline"),
  lastSeen: timestamp("last_seen", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatRooms = pgTable("chat_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").default(""),
  icon: varchar("icon", { length: 10 }).default("💬"),
  category: roomCategoryEnum("category").default("general"),
  createdBy: uuid("created_by").references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  joinCode: varchar("join_code", { length: 20 }),
  maxMembers: integer("max_members").default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const roomMembers = pgTable("room_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => chatRooms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: memberRoleEnum("role").default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => chatRooms.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text"),
  textColor: varchar("text_color", { length: 20 }).default("default"),
  textFormat: varchar("text_format", { length: 50 }).default("normal"),
  textSize: varchar("text_size", { length: 10 }).default("md"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const privateMessages = pgTable("private_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  textColor: varchar("text_color", { length: 20 }).default("default"),
  textFormat: varchar("text_format", { length: 50 }).default("normal"),
  textSize: varchar("text_size", { length: 10 }).default("md"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  friendId: uuid("friend_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: friendshipStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mail = pgTable("mail", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  read: boolean("read").default(false),
  starred: boolean("starred").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  roomMemberships: many(roomMembers),
  messages: many(messages),
  sentPrivateMessages: many(privateMessages, { relationName: "sender" }),
  receivedPrivateMessages: many(privateMessages, { relationName: "receiver" }),
  friendshipsInitiated: many(friendships, { relationName: "user" }),
  friendshipsReceived: many(friendships, { relationName: "friend" }),
  createdRooms: many(chatRooms),
  sentMail: many(mail, { relationName: "mailSender" }),
  receivedMail: many(mail, { relationName: "mailReceiver" }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [chatRooms.createdBy],
    references: [users.id],
  }),
  members: many(roomMembers),
  messages: many(messages),
}));

export const roomMembersRelations = relations(roomMembers, ({ one }) => ({
  room: one(chatRooms, {
    fields: [roomMembers.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [roomMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const privateMessagesRelations = relations(privateMessages, ({ one }) => ({
  sender: one(users, {
    fields: [privateMessages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [privateMessages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "user",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "friend",
  }),
}));

export const mailRelations = relations(mail, ({ one }) => ({
  sender: one(users, {
    fields: [mail.senderId],
    references: [users.id],
    relationName: "mailSender",
  }),
  receiver: one(users, {
    fields: [mail.receiverId],
    references: [users.id],
    relationName: "mailReceiver",
  }),
}));
