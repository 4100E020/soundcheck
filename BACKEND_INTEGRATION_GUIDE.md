# SoundCheck 後端 API 整合指南

## 目錄
1. [架構概述](#架構概述)
2. [認證系統](#認證系統)
3. [資料庫設計](#資料庫設計)
4. [API 端點設計](#api-端點設計)
5. [前端整合](#前端整合)
6. [實作步驟](#實作步驟)
7. [測試策略](#測試策略)

---

## 架構概述

### 技術棧
- **前端**: React Native + Expo Router
- **後端**: Node.js + Express + tRPC
- **資料庫**: MySQL + Drizzle ORM
- **認證**: Manus OAuth + JWT
- **存儲**: S3 相容存儲 (票根、頭像、視頻)
- **實時通信**: WebSocket (Socket.io)

### 系統架構圖
```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  UI Screens (Login, Events, Chat, Profile, etc.)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Client (lib/trpc.ts)                           │   │
│  │  - Automatic type safety                             │   │
│  │  - Query & Mutation hooks                            │   │
│  │  - Error handling                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Router (server/routers.ts)                     │   │
│  │  - Auth procedures                                   │   │
│  │  - Event procedures                                  │   │
│  │  - Chat procedures                                   │   │
│  │  - Matching procedures                               │   │
│  │  - Crew procedures                                   │   │
│  │  - Ticket procedures                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database Layer (server/db.ts)                       │   │
│  │  - Query builders                                    │   │
│  │  - Transactions                                      │   │
│  │  - Data validation                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables:                                             │   │
│  │  - users, profiles, music_genes                      │   │
│  │  - events, event_details, event_attendees           │   │
│  │  - matches, match_history                            │   │
│  │  - crews, crew_members, crew_applications            │   │
│  │  - chats, chat_messages, chat_participants           │   │
│  │  - tickets, ticket_verifications                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 認證系統

### 1. OAuth 流程

#### 登入流程 (原生)
```
用戶點擊登入
    ↓
調用 startOAuthLogin()
    ↓
系統瀏覽器打開 Manus OAuth
    ↓
用戶認證
    ↓
重定向到 /oauth/callback?code=xxx&state=yyy
    ↓
App 攔截深連結
    ↓
交換 code 獲取 JWT token
    ↓
存儲 token 到 SecureStore
    ↓
導向主應用程式
```

#### 實作代碼
```typescript
// app/auth/login.tsx
import { useAuth } from "@/hooks/use-auth";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

export default function LoginScreen() {
  const { startOAuthLogin } = useAuth();

  const handleLogin = async () => {
    try {
      await startOAuthLogin();
      // 用戶會被重定向到 /oauth/callback
      // 自動導向主應用程式
    } catch (error) {
      Alert.alert("登入失敗", error.message);
    }
  };

  return (
    <TouchableOpacity onPress={handleLogin}>
      <Text>使用 Manus 登入</Text>
    </TouchableOpacity>
  );
}
```

### 2. 會話管理

#### Token 存儲
```typescript
// hooks/use-auth.ts (已實作)
import * as SecureStore from "expo-secure-store";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 應用程式啟動時恢復會話
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (token) {
          // 驗證 token 有效性
          const response = await trpc.auth.verify.query();
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Session restore failed:", error);
      }
    };

    restoreSession();
  }, []);

  return { user, isAuthenticated };
}
```

#### Token 刷新
```typescript
// server/routers.ts
export const appRouter = router({
  auth: router({
    verify: publicProcedure.query(async ({ ctx }) => {
      // 驗證 JWT token
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return { user: ctx.user };
    }),

    refresh: publicProcedure.mutation(async ({ ctx }) => {
      // 刷新 token
      const newToken = generateJWT(ctx.user);
      return { token: newToken };
    }),
  }),
});
```

### 3. 權限控制

```typescript
// server/routers.ts
import { protectedProcedure, publicProcedure } from "./_core/trpc";

export const appRouter = router({
  // 公開端點 (無需認證)
  events: router({
    list: publicProcedure.query(() => {
      return db.getAllEvents();
    }),
  }),

  // 受保護端點 (需要認證)
  user: router({
    profile: protectedProcedure.query(({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(updateProfileSchema)
      .mutation(({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, input);
      }),
  }),

  // 管理員端點
  admin: router({
    verifyTicket: protectedProcedure
      .input(z.object({ ticketId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // 檢查管理員權限
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.verifyTicket(input.ticketId);
      }),
  }),
});
```

---

## 資料庫設計

### 1. 核心表結構

#### 用戶表
```typescript
// drizzle/schema.ts
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  name: varchar("name", { length: 255 }),
  avatar: varchar("avatar", { length: 512 }), // S3 URL
  bio: text("bio"),
  birthDate: date("birthDate"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  location: varchar("location", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  role: mysqlEnum("role", ["user", "vvip", "admin"]).default("user"),
  isVerified: boolean("isVerified").default(false),
  verificationDate: timestamp("verificationDate"),
  lastSignedIn: timestamp("lastSignedIn"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

#### 活動表
```typescript
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image: varchar("image", { length: 512 }), // S3 URL
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  venue: varchar("venue", { length: 255 }).notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  capacity: int("capacity"),
  attendeeCount: int("attendeeCount").default(0),
  category: mysqlEnum("category", [
    "concert",
    "festival",
    "club",
    "workshop",
    "other",
  ]).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  ticketUrl: varchar("ticketUrl", { length: 512 }),
  organizer: varchar("organizer", { length: 255 }),
  status: mysqlEnum("status", ["upcoming", "ongoing", "completed", "cancelled"])
    .default("upcoming"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
```

#### 配對表
```typescript
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  userId1: int("userId1").notNull(),
  userId2: int("userId2").notNull(),
  eventId: int("eventId").notNull(),
  similarity: decimal("similarity", { precision: 5, scale: 2 }), // 0-100
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "blocked"])
    .default("pending"),
  initiatedBy: int("initiatedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Match = typeof matches.$inferSelect;
```

#### 揪團表
```typescript
export const crews = mysqlTable("crews", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  memberCount: int("memberCount").default(1),
  maxMembers: int("maxMembers").default(10),
  meetingPoint: varchar("meetingPoint", { length: 255 }),
  meetingTime: timestamp("meetingTime"),
  status: mysqlEnum("status", ["open", "full", "closed"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Crew = typeof crews.$inferSelect;
```

#### 聊天表
```typescript
export const chats = mysqlTable("chats", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["private", "group"]).notNull(),
  name: varchar("name", { length: 255 }), // 群組名稱
  createdBy: int("createdBy"),
  crewId: int("crewId"), // 如果是揪團群組
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  chatId: int("chatId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["text", "image", "voice"]).default("text"),
  mediaUrl: varchar("mediaUrl", { length: 512 }), // S3 URL
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Chat = typeof chats.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
```

#### 票根表
```typescript
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: int("eventId").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
  ticketImage: varchar("ticketImage", { length: 512 }), // S3 URL
  status: mysqlEnum("status", ["pending", "verified", "rejected", "used"])
    .default("pending"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"), // 驗證者 ID
  vvipBadgeAwarded: boolean("vvipBadgeAwarded").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Ticket = typeof tickets.$inferSelect;
```

### 2. 表關係

```typescript
// drizzle/relations.ts
import { relations } from "drizzle-orm";
import {
  users,
  events,
  matches,
  crews,
  chats,
  chatMessages,
  tickets,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  createdEvents: many(events, { relationName: "createdBy" }),
  matches: many(matches),
  crews: many(crews, { relationName: "createdBy" }),
  tickets: many(tickets),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
    relationName: "createdBy",
  }),
  matches: many(matches),
  crews: many(crews),
  tickets: many(tickets),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user1: one(users, {
    fields: [matches.userId1],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [matches.userId2],
    references: [users.id],
  }),
  event: one(events, {
    fields: [matches.eventId],
    references: [events.id],
  }),
}));
```

---

## API 端點設計

### 1. 認證 API

```typescript
// server/routers.ts
export const appRouter = router({
  auth: router({
    // 登入
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "用戶不存在",
          });
        }

        const isValidPassword = await verifyPassword(
          input.password,
          user.passwordHash
        );
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "密碼錯誤",
          });
        }

        const token = generateJWT(user);
        return { token, user };
      }),

    // 註冊
    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().min(2),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // 檢查郵箱是否已存在
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "郵箱已被使用",
          });
        }

        // 發送驗證碼
        const verificationCode = generateVerificationCode();
        await db.saveVerificationCode(input.email, verificationCode);
        await sendVerificationEmail(input.email, verificationCode);

        return { message: "驗證碼已發送" };
      }),

    // 驗證郵箱
    verifyEmail: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().length(6),
          password: z.string().min(6),
          name: z.string().min(2),
        })
      )
      .mutation(async ({ input }) => {
        // 驗證碼檢查
        const isValid = await db.verifyCode(input.email, input.code);
        if (!isValid) {
          throw new TRPCError({
            code: "INVALID_REQUEST",
            message: "驗證碼無效或已過期",
          });
        }

        // 創建用戶
        const passwordHash = await hashPassword(input.password);
        const user = await db.createUser({
          email: input.email,
          name: input.name,
          passwordHash,
        });

        const token = generateJWT(user);
        return { token, user };
      }),

    // 忘記密碼
    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          // 不洩露用戶是否存在
          return { message: "如果郵箱存在,驗證碼已發送" };
        }

        const resetCode = generateVerificationCode();
        await db.saveResetCode(user.id, resetCode);
        await sendResetEmail(input.email, resetCode);

        return { message: "重設碼已發送" };
      }),

    // 重設密碼
    resetPassword: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().length(6),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const isValid = await db.verifyResetCode(user.id, input.code);
        if (!isValid) {
          throw new TRPCError({ code: "INVALID_REQUEST" });
        }

        const passwordHash = await hashPassword(input.newPassword);
        await db.updateUserPassword(user.id, passwordHash);

        return { message: "密碼已重設" };
      }),
  }),
});
```

### 2. 活動 API

```typescript
export const appRouter = router({
  events: router({
    // 獲取活動列表
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          city: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return db.getEvents(input);
      }),

    // 獲取活動詳情
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEventDetail(input.id);
      }),

    // 創建活動 (需要認證)
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string(),
          startDate: z.date(),
          endDate: z.date(),
          venue: z.string(),
          address: z.string(),
          latitude: z.number(),
          longitude: z.number(),
          capacity: z.number(),
          category: z.enum([
            "concert",
            "festival",
            "club",
            "workshop",
            "other",
          ]),
          price: z.number().optional(),
          ticketUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createEvent({
          ...input,
          createdBy: ctx.user.id,
        });
      }),

    // 收藏活動
    favorite: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.addFavoriteEvent(ctx.user.id, input.eventId);
      }),

    // 取消收藏
    unfavorite: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.removeFavoriteEvent(ctx.user.id, input.eventId);
      }),

    // 獲取附近活動
    nearby: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          radiusKm: z.number().default(10),
        })
      )
      .query(async ({ input }) => {
        return db.getNearbyEvents(input);
      }),
  }),
});
```

### 3. 配對 API

```typescript
export const appRouter = router({
  matches: router({
    // 獲取配對卡片
    getCards: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMatchCards(ctx.user.id, input.eventId);
      }),

    // 喜歡用戶
    like: protectedProcedure
      .input(z.object({ userId: z.number(), eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.createMatch({
          userId1: ctx.user.id,
          userId2: input.userId,
          eventId: input.eventId,
          initiatedBy: ctx.user.id,
          status: "pending",
        });
      }),

    // 不喜歡用戶
    pass: protectedProcedure
      .input(z.object({ userId: z.number(), eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.recordPass(ctx.user.id, input.userId, input.eventId);
      }),

    // 獲取配對歷史
    history: protectedProcedure.query(async ({ ctx }) => {
      return db.getMatchHistory(ctx.user.id);
    }),

    // 獲取誰喜歡我 (VVIP 功能)
    whoLikesMe: protectedProcedure.query(async ({ ctx }) => {
      // 檢查 VVIP 狀態
      const user = await db.getUser(ctx.user.id);
      if (user.role !== "vvip") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "此功能僅限 VVIP 用戶",
        });
      }

      return db.getWhoLikesMe(ctx.user.id);
    }),
  }),
});
```

### 4. 揪團 API

```typescript
export const appRouter = router({
  crews: router({
    // 創建揪團
    create: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          maxMembers: z.number().default(10),
          meetingPoint: z.string().optional(),
          meetingTime: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.createCrew({
          ...input,
          createdBy: ctx.user.id,
          memberCount: 1,
        });
      }),

    // 申請加入揪團
    apply: protectedProcedure
      .input(z.object({ crewId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.createCrewApplication({
          crewId: input.crewId,
          userId: ctx.user.id,
          status: "pending",
        });
      }),

    // 審核申請
    approveApplication: protectedProcedure
      .input(z.object({ applicationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // 檢查是否是揪團創建者
        const application = await db.getApplication(input.applicationId);
        const crew = await db.getCrew(application.crewId);

        if (crew.createdBy !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return db.approveApplication(input.applicationId);
      }),

    // 獲取揪團詳情
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getCrewDetail(input.id);
      }),

    // 獲取揪團成員
    members: publicProcedure
      .input(z.object({ crewId: z.number() }))
      .query(async ({ input }) => {
        return db.getCrewMembers(input.crewId);
      }),
  }),
});
```

### 5. 聊天 API

```typescript
export const appRouter = router({
  chat: router({
    // 獲取聊天列表
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserChats(ctx.user.id);
    }),

    // 獲取聊天消息
    messages: protectedProcedure
      .input(
        z.object({
          chatId: z.number(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return db.getChatMessages(input.chatId, input.limit, input.offset);
      }),

    // 發送消息
    sendMessage: protectedProcedure
      .input(
        z.object({
          chatId: z.number(),
          content: z.string().min(1),
          type: z.enum(["text", "image", "voice"]).default("text"),
          mediaUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const message = await db.createChatMessage({
          chatId: input.chatId,
          senderId: ctx.user.id,
          content: input.content,
          type: input.type,
          mediaUrl: input.mediaUrl,
        });

        // 發出 WebSocket 事件
        io.to(`chat:${input.chatId}`).emit("message", message);

        return message;
      }),

    // 標記消息已讀
    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        return db.markMessageAsRead(input.messageId);
      }),

    // 創建私聊
    createPrivateChat: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.createOrGetPrivateChat(ctx.user.id, input.userId);
      }),
  }),
});
```

### 6. 票根 API

```typescript
export const appRouter = router({
  tickets: router({
    // 上傳票根
    upload: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          imageUrl: z.string(), // S3 URL
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 調用 OCR 識別票號
        const ocrResult = await recognizeTicketNumber(input.imageUrl);

        return db.createTicket({
          userId: ctx.user.id,
          eventId: input.eventId,
          ticketNumber: ocrResult.ticketNumber,
          ticketImage: input.imageUrl,
          status: "pending",
        });
      }),

    // 驗證票根 (管理員)
    verify: protectedProcedure
      .input(
        z.object({
          ticketId: z.number(),
          approved: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // 檢查管理員權限
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const ticket = await db.getTicket(input.ticketId);

        if (input.approved) {
          // 頒發 VVIP 徽章
          await db.updateUserRole(ticket.userId, "vvip");
          await db.updateTicket(input.ticketId, {
            status: "verified",
            verifiedAt: new Date(),
            verifiedBy: ctx.user.id,
            vvipBadgeAwarded: true,
          });
        } else {
          await db.updateTicket(input.ticketId, {
            status: "rejected",
            verifiedAt: new Date(),
            verifiedBy: ctx.user.id,
          });
        }

        return { success: true };
      }),

    // 獲取用戶票根
    myTickets: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserTickets(ctx.user.id);
    }),
  }),
});
```

---

## 前端整合

### 1. tRPC 客戶端設置

```typescript
// lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/routers";

export const trpc = createTRPCReact<AppRouter>();
```

### 2. 提供者設置

```typescript
// app/_layout.tsx
import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import * as SecureStore from "expo-secure-store";

const queryClient = new QueryClient();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.EXPO_PUBLIC_API_URL}/trpc`,
      async headers() {
        const token = await SecureStore.getItemAsync("auth_token");
        return {
          authorization: token ? `Bearer ${token}` : "",
        };
      },
    }),
  ],
});

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Your app */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### 3. 在組件中使用

```typescript
// app/(tabs)/events.tsx
import { trpc } from "@/lib/trpc";

export default function EventsScreen() {
  // Query
  const { data: events, isLoading, refetch } = trpc.events.list.useQuery({
    category: "concert",
    limit: 20,
  });

  // Mutation
  const favoriteMutation = trpc.events.favorite.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading) return <ActivityIndicator />;

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onFavorite={() =>
            favoriteMutation.mutate({ eventId: item.id })
          }
        />
      )}
    />
  );
}
```

---

## 實作步驟

### 第 1 步: 設置環境變數

```bash
# .env.local
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_OAUTH_URL=https://oauth.manus.im
DATABASE_URL=mysql://user:password@localhost:3306/soundcheck
```

### 第 2 步: 遷移資料庫

```bash
pnpm db:push
```

### 第 3 步: 實作後端 API

1. 在 `server/routers.ts` 中添加路由
2. 在 `server/db.ts` 中添加查詢函數
3. 在 `drizzle/schema.ts` 中定義表

### 第 4 步: 實作前端集成

1. 使用 tRPC hooks 替換模擬數據
2. 添加錯誤處理和加載狀態
3. 實現樂觀更新

### 第 5 步: 測試

```bash
pnpm test
```

---

## 測試策略

### 單元測試

```typescript
// tests/auth.test.ts
import { describe, it, expect } from "vitest";
import { trpc } from "@/lib/trpc";

describe("Auth API", () => {
  it("should login with valid credentials", async () => {
    const result = await trpc.auth.login.mutate({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
  });

  it("should reject invalid credentials", async () => {
    expect(async () => {
      await trpc.auth.login.mutate({
        email: "test@example.com",
        password: "wrongpassword",
      });
    }).rejects.toThrow();
  });
});
```

### 集成測試

```typescript
// tests/events.integration.test.ts
describe("Events API Integration", () => {
  it("should create event and retrieve it", async () => {
    // 創建活動
    const event = await trpc.events.create.mutate({
      title: "Test Concert",
      description: "Test",
      startDate: new Date(),
      endDate: new Date(),
      venue: "Test Venue",
      address: "Test Address",
      latitude: 25.0,
      longitude: 121.0,
      capacity: 100,
      category: "concert",
    });

    // 檢索活動
    const retrieved = await trpc.events.detail.query({ id: event.id });

    expect(retrieved.title).toBe("Test Concert");
  });
});
```

---

## 常見問題

### Q1: 如何處理離線場景?
使用 TanStack Query 的緩存機制和本地 AsyncStorage:

```typescript
const { data } = trpc.events.list.useQuery(
  { limit: 20 },
  {
    staleTime: 5 * 60 * 1000, // 5 分鐘
    cacheTime: 30 * 60 * 1000, // 30 分鐘
  }
);
```

### Q2: 如何實現實時更新?
使用 WebSocket 和 Socket.io:

```typescript
// server/_core/websocket.ts
io.on("connection", (socket) => {
  socket.on("join-event", (eventId) => {
    socket.join(`event:${eventId}`);
  });

  socket.on("new-match", (data) => {
    io.to(`event:${data.eventId}`).emit("match-notification", data);
  });
});
```

### Q3: 如何處理文件上傳?
使用 S3 預簽名 URL:

```typescript
// server/routers.ts
upload: protectedProcedure
  .input(z.object({ filename: z.string() }))
  .mutation(async ({ input }) => {
    const presignedUrl = await generatePresignedUrl(
      `tickets/${Date.now()}-${input.filename}`
    );
    return { presignedUrl };
  }),
```

---

## 總結

這份指南涵蓋了從認證、資料庫設計到 API 端點的完整後端架構。按照步驟逐一實現,即可將應用程式從模擬數據轉換為真實的生產系統。
