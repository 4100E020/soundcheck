import {
  boolean,
  float,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  nickname: varchar("nickname", { length: 100 }),
  avatar: text("avatar"),
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  bio: text("bio"),
  isVVIP: boolean("isVVIP").default(false).notNull(),
  dailySwipeCount: int("dailySwipeCount").default(0).notNull(),
  lastSwipeReset: timestamp("lastSwipeReset").defaultNow(),
  spotifyConnected: boolean("spotifyConnected").default(false).notNull(),
  spotifyUserId: varchar("spotifyUserId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// 音樂基因資料表
// ============================================================

export const musicProfiles = mysqlTable("music_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topArtists: json("topArtists").$type<string[]>(),
  topGenres: json("topGenres").$type<string[]>(),
  audioFeatures: json("audioFeatures").$type<{
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
  }>(),
  musicVector: json("musicVector").$type<number[]>(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

// ============================================================
// 活動相關表
// ============================================================

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImage: text("coverImage"),
  eventType: mysqlEnum("eventType", ["festival", "concert", "livehouse", "other"]).notNull(),
  venue: varchar("venue", { length: 255 }),
  address: text("address"),
  region: mysqlEnum("region", ["north", "central", "south", "east"]),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  lineup: json("lineup").$type<string[]>(),
  ticketUrl: text("ticketUrl"),
  officialUrl: text("officialUrl"),
  participantCount: int("participantCount").default(0).notNull(),
  vvipCount: int("vvipCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  startDateIdx: index("startDate_idx").on(table.startDate),
  regionIdx: index("region_idx").on(table.region),
}));

export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  userEventIdx: uniqueIndex("user_event_idx").on(table.userId, table.eventId),
  userIdIdx: index("userId_idx").on(table.userId),
  eventIdIdx: index("eventId_idx").on(table.eventId),
}));

export const ticketVerifications = mysqlTable("ticket_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  ticketImage: text("ticketImage").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 255 }),
  orderNumber: varchar("orderNumber", { length: 255 }),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  eventIdIdx: index("eventId_idx").on(table.eventId),
  ticketNumberIdx: index("ticketNumber_idx").on(table.ticketNumber),
}));

// ============================================================
// 配對相關表
// ============================================================

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  user1Id: int("user1Id").notNull(),
  user2Id: int("user2Id").notNull(),
  eventId: int("eventId"),
  matchScore: float("matchScore"),
  status: mysqlEnum("status", ["pending", "matched", "rejected"]).default("pending").notNull(),
  matchedAt: timestamp("matchedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  user1Idx: index("user1_idx").on(table.user1Id),
  user2Idx: index("user2_idx").on(table.user2Id),
  eventIdIdx: index("eventId_idx").on(table.eventId),
}));

export const swipes = mysqlTable("swipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  targetUserId: int("targetUserId").notNull(),
  eventId: int("eventId"),
  action: mysqlEnum("action", ["like", "pass"]).notNull(),
  songId: varchar("songId", { length: 255 }),
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userTargetIdx: uniqueIndex("user_target_idx").on(table.userId, table.targetUserId),
  userIdIdx: index("userId_idx").on(table.userId),
  targetUserIdIdx: index("targetUserId_idx").on(table.targetUserId),
}));

// ============================================================
// 揪團相關表
// ============================================================

export const crews = mysqlTable("crews", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  creatorId: int("creatorId").notNull(),
  type: mysqlEnum("type", ["transport", "accommodation", "onsite", "ticket"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  details: json("details").$type<{
    origin?: string;
    destination?: string;
    departureTime?: string;
    location?: string;
    checkInDate?: string;
    checkOutDate?: string;
    roomType?: string;
    meetTime?: string;
    meetLocation?: string;
    purpose?: string;
    ticketType?: string;
    quantity?: number;
    price?: number;
    tradeMethod?: string;
  }>(),
  maxMembers: int("maxMembers").notNull(),
  currentMembers: int("currentMembers").default(1).notNull(),
  isFull: boolean("isFull").default(false).notNull(),
  status: mysqlEnum("status", ["open", "full", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  eventIdIdx: index("eventId_idx").on(table.eventId),
  creatorIdIdx: index("creatorId_idx").on(table.creatorId),
  typeIdx: index("type_idx").on(table.type),
}));

export const crewMembers = mysqlTable("crew_members", {
  id: int("id").autoincrement().primaryKey(),
  crewId: int("crewId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  crewUserIdx: uniqueIndex("crew_user_idx").on(table.crewId, table.userId),
  crewIdIdx: index("crewId_idx").on(table.crewId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

// ============================================================
// 聊天相關表
// ============================================================

export const chatRooms = mysqlTable("chat_rooms", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["private", "crew"]).notNull(),
  crewId: int("crewId"),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  crewIdIdx: index("crewId_idx").on(table.crewId),
}));

export const chatRoomMembers = mysqlTable("chat_room_members", {
  id: int("id").autoincrement().primaryKey(),
  chatRoomId: int("chatRoomId").notNull(),
  userId: int("userId").notNull(),
  unreadCount: int("unreadCount").default(0).notNull(),
  lastReadAt: timestamp("lastReadAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ({
  roomUserIdx: uniqueIndex("room_user_idx").on(table.chatRoomId, table.userId),
  chatRoomIdIdx: index("chatRoomId_idx").on(table.chatRoomId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  chatRoomId: int("chatRoomId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "song"]).default("text").notNull(),
  metadata: json("metadata").$type<{
    songId?: string;
    songName?: string;
    artistName?: string;
    imageUrl?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  chatRoomIdIdx: index("chatRoomId_idx").on(table.chatRoomId),
  senderIdIdx: index("senderId_idx").on(table.senderId),
}));

// ============================================================
// 類型導出
// ============================================================

export type MusicProfile = typeof musicProfiles.$inferSelect;
export type InsertMusicProfile = typeof musicProfiles.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;

export type TicketVerification = typeof ticketVerifications.$inferSelect;
export type InsertTicketVerification = typeof ticketVerifications.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = typeof swipes.$inferInsert;

export type Crew = typeof crews.$inferSelect;
export type InsertCrew = typeof crews.$inferInsert;

export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = typeof crewMembers.$inferInsert;

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = typeof chatRooms.$inferInsert;

export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type InsertChatRoomMember = typeof chatRoomMembers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================================
// 標準化活動資料表 (從爬蟲獲取)
// ============================================================

export const standardizedEvents = mysqlTable("standardized_events", {
  // 基本信息
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  sourceId: varchar("sourceId", { length: 255 }).notNull(),
  source: mysqlEnum("source", ["kktix", "indievox", "accupass", "tixcraft", "ibon", "manual"]).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  
  // 活動信息
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  descriptionHtml: text("descriptionHtml"),
  summary: text("summary"),
  
  // 時間信息
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  
  // 場地信息 (JSON)
  venue: json("venue").$type<{
    name: string;
    address: string;
    city: string;
    district?: string;
    location: {
      latitude: number;
      longitude: number;
    };
    capacity?: number;
    venueType?: string;
  }>().notNull(),
  
  // 票務信息 (JSON)
  ticketing: json("ticketing").$type<{
    status: string;
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    isFree: boolean;
    ticketUrl?: string;
    ticketPlatform?: string;
  }>().notNull(),
  
  // 分類與標籤
  category: mysqlEnum("category", [
    "concert",
    "festival",
    "club_event",
    "live_music",
    "dj_set",
    "workshop",
    "conference",
    "party",
    "other",
  ]).notNull(),
  tags: json("tags").$type<string[]>(),
  genres: json("genres").$type<string[]>(),
  
  // 主辦方信息 (JSON)
  organizer: json("organizer").$type<{
    name: string;
    organizationId?: string;
  }>().notNull(),
  
  // 媒體資源 (JSON)
  images: json("images").$type<Array<{
    url: string;
    type: string;
  }>>().notNull(),
  
  // 陣容信息 (JSON, 可選)
  lineup: json("lineup").$type<Array<{
    name: string;
    role?: string;
    order?: number;
  }>>(),
  
  // 元數據 (JSON)
  metadata: json("metadata").$type<{
    scrapedAt: Date;
    lastCheckedAt: Date;
    version: number;
    isActive: boolean;
    qualityScore?: number;
  }>().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sourceIdx: uniqueIndex("source_sourceId_idx").on(table.source, table.sourceId),
  startDateIdx: index("startDate_idx").on(table.startDate),
  categoryIdx: index("category_idx").on(table.category),
}));

export type StandardizedEvent = typeof standardizedEvents.$inferSelect;
export type InsertStandardizedEvent = typeof standardizedEvents.$inferInsert;

