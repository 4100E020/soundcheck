import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { eq, and, desc, asc, sql, or } from "drizzle-orm";
import {
  events,
  users,
  userEvents,
  ticketVerifications,
  matches,
  swipes,
  crews,
  crewMembers,
  chatRooms,
  chatRoomMembers,
  messages,
  musicProfiles,
  standardizedEvents,
} from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    
    // 註冊
    signup: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          displayName: z.string().min(1),
          birthDate: z.string().optional(),
          gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
          location: z.object({
            latitude: z.number(),
            longitude: z.number(),
            city: z.string().optional(),
          }).optional(),
          musicGenres: z.array(z.string()).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        
        // 檢查 email 是否已存在
        const existing = await db.query.users.findFirst({
          where: eq(users.email, input.email),
        });
        
        if (existing) {
          throw new Error("此 email 已被註冊");
        }
        
        // Hash 密碼
        const passwordHash = await bcrypt.hash(input.password, 10);
        
        // 建立用戶
        const [user] = await db.insert(users).values({
          email: input.email,
          passwordHash,
          displayName: input.displayName,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          gender: input.gender || null,
          bio: null,
          avatarUrl: null,
          location: input.location ? JSON.stringify(input.location) : null,
          musicGenres: input.musicGenres || [],
          spotifyConnected: false,
          verifiedEvents: [],
          vvipStatus: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        
        return {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
        };
      }),
    
    // 登入
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        
        // 查找用戶
        const user = await db.query.users.findFirst({
          where: eq(users.email, input.email),
        });
        
        if (!user || !user.passwordHash) {
          throw new Error("帳號或密碼錯誤");
        }
        
        // 驗證密碼
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!isValid) {
          throw new Error("帳號或密碼錯誤");
        }
        
        return {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            vvipStatus: user.vvipStatus,
          },
        };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================
  // 活動 API
  // ============================================================
  events: router({
    // 真實活動數據 (從爬蟲獲取)
    listReal: publicProcedure
      .input(
        z.object({
          category: z.enum(["concert", "festival", "club_event", "live_music", "dj_set", "workshop", "conference", "party", "other"]).optional(),
          city: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        }).optional(),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        let query = db.select().from(standardizedEvents);
        
        // Apply filters
        const conditions = [];
        if (input?.category) {
          conditions.push(eq(standardizedEvents.category, input.category));
        }
        if (input?.startDate) {
          conditions.push(sql`${standardizedEvents.startDate} >= ${input.startDate}`);
        }
        if (input?.endDate) {
          conditions.push(sql`${standardizedEvents.endDate} <= ${input.endDate}`);
        }
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as any;
        }
        
        const result = await query
          .orderBy(asc(standardizedEvents.startDate))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0);
        
        return result;
      }),

    getRealById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db
          .select()
          .from(standardizedEvents)
          .where(eq(standardizedEvents.id, input.id))
          .limit(1);
        return result[0] ?? null;
      }),

    // 舊的模擬數據 API (保留向後兼容)
    list: publicProcedure
      .input(
        z.object({
          eventType: z.enum(["festival", "concert", "livehouse", "other"]).optional(),
          region: z.enum(["north", "central", "south", "east"]).optional(),
          sortBy: z.enum(["date", "popularity", "name"]).optional().default("date"),
        }).optional(),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const result = await db.select().from(events).orderBy(asc(events.startDate));
        return result;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(events).where(eq(events.id, input.id)).limit(1);
        return result[0] ?? null;
      }),
  }),

  // ============================================================
  // 票根驗證 API
  // ============================================================
  tickets: router({
    verify: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          ticketImage: z.string(),
          ticketNumber: z.string().optional(),
          orderNumber: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false, message: "Database unavailable" };

        // Insert verification record
        await db.insert(ticketVerifications).values({
          userId: ctx.user.id,
          eventId: input.eventId,
          ticketImage: input.ticketImage,
          ticketNumber: input.ticketNumber ?? null,
          orderNumber: input.orderNumber ?? null,
          status: "pending",
        });

        // Simulate auto-verification (in production, use AI/manual review)
        // For now, auto-verify
        const verifications = await db
          .select()
          .from(ticketVerifications)
          .where(
            and(
              eq(ticketVerifications.userId, ctx.user.id),
              eq(ticketVerifications.eventId, input.eventId),
            ),
          )
          .orderBy(desc(ticketVerifications.createdAt))
          .limit(1);

        if (verifications.length > 0) {
          await db
            .update(ticketVerifications)
            .set({ status: "verified", verifiedAt: new Date() })
            .where(eq(ticketVerifications.id, verifications[0].id));

          // Update user VVIP status
          await db.update(users).set({ isVVIP: true }).where(eq(users.id, ctx.user.id));

          // Add user to event
          await db
            .insert(userEvents)
            .values({ userId: ctx.user.id, eventId: input.eventId, isVerified: true })
            .onDuplicateKeyUpdate({ set: { isVerified: true } });
        }

        return { success: true, message: "驗證成功" };
      }),

    myVerifications: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(ticketVerifications)
        .where(eq(ticketVerifications.userId, ctx.user.id))
        .orderBy(desc(ticketVerifications.createdAt));
    }),
  }),

  // ============================================================
  // 配對 API
  // ============================================================
  matching: router({
    getDiscoverUsers: protectedProcedure
      .input(z.object({ eventId: z.number().optional() }).optional())
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return [];
        // Get users excluding self
        const result = await db
          .select()
          .from(users)
          .where(sql`${users.id} != ${ctx.user.id}`)
          .limit(30);
        return result;
      }),

    swipe: protectedProcedure
      .input(
        z.object({
          targetUserId: z.number(),
          action: z.enum(["like", "pass"]),
          eventId: z.number().optional(),
          songId: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { matched: false };

        // Record swipe
        await db.insert(swipes).values({
          userId: ctx.user.id,
          targetUserId: input.targetUserId,
          action: input.action,
          eventId: input.eventId ?? null,
          songId: input.songId ?? null,
        });

        // Check for mutual like
        if (input.action === "like") {
          const mutualLike = await db
            .select()
            .from(swipes)
            .where(
              and(
                eq(swipes.userId, input.targetUserId),
                eq(swipes.targetUserId, ctx.user.id),
                eq(swipes.action, "like"),
              ),
            )
            .limit(1);

          if (mutualLike.length > 0) {
            // Create match
            await db.insert(matches).values({
              user1Id: Math.min(ctx.user.id, input.targetUserId),
              user2Id: Math.max(ctx.user.id, input.targetUserId),
              eventId: input.eventId ?? null,
              status: "matched",
              matchedAt: new Date(),
            });

            // Create private chat room
            const chatResult = await db.insert(chatRooms).values({ type: "private" });
            const chatRoomId = Number(chatResult[0].insertId);

            await db.insert(chatRoomMembers).values([
              { chatRoomId, userId: ctx.user.id },
              { chatRoomId, userId: input.targetUserId },
            ]);

            return { matched: true };
          }
        }

        // Update daily swipe count
        await db
          .update(users)
          .set({ dailySwipeCount: sql`${users.dailySwipeCount} + 1` })
          .where(eq(users.id, ctx.user.id));

        return { matched: false };
      }),

    whoLikesMe: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Only VVIP can see who likes them
      if (!ctx.user.isVVIP) return [];

      const likers = await db
        .select({
          id: users.id,
          nickname: users.nickname,
          avatar: users.avatar,
          age: users.age,
          isVVIP: users.isVVIP,
          swipedAt: swipes.createdAt,
        })
        .from(swipes)
        .innerJoin(users, eq(swipes.userId, users.id))
        .where(
          and(
            eq(swipes.targetUserId, ctx.user.id),
            eq(swipes.action, "like"),
          ),
        )
        .orderBy(desc(swipes.createdAt));

      return likers;
    }),
  }),

  // ============================================================
  // 揪團 API
  // ============================================================
  crews: router({
    listByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(crews)
          .where(eq(crews.eventId, input.eventId))
          .orderBy(desc(crews.createdAt));
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select().from(crews).where(eq(crews.id, input.id)).limit(1);
        return result[0] ?? null;
      }),

    create: protectedProcedure
      .input(
        z.object({
          eventId: z.number(),
          type: z.enum(["transport", "accommodation", "onsite", "ticket"]),
          title: z.string().min(1),
          description: z.string().optional(),
          maxMembers: z.number().min(2).max(50),
          details: z.record(z.string(), z.string()).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        const result = await db.insert(crews).values({
          eventId: input.eventId,
          creatorId: ctx.user.id,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          maxMembers: input.maxMembers,
          details: input.details ?? null,
        });

        const crewId = Number(result[0].insertId);

        // Add creator as member
        await db.insert(crewMembers).values({
          crewId,
          userId: ctx.user.id,
          status: "accepted",
        });

        // Create crew chat room
        const chatResult = await db.insert(chatRooms).values({
          type: "crew",
          crewId,
        });
        const chatRoomId = Number(chatResult[0].insertId);

        await db.insert(chatRoomMembers).values({
          chatRoomId,
          userId: ctx.user.id,
        });

        return { success: true, crewId };
      }),

    join: protectedProcedure
      .input(z.object({ crewId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        await db.insert(crewMembers).values({
          crewId: input.crewId,
          userId: ctx.user.id,
          status: "pending",
        });

        return { success: true, message: "申請已送出" };
      }),
  }),

  // ============================================================
  // 聊天 API
  // ============================================================
  chat: router({
    myRooms: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const rooms = await db
        .select({
          id: chatRooms.id,
          type: chatRooms.type,
          crewId: chatRooms.crewId,
          lastMessageAt: chatRooms.lastMessageAt,
          unreadCount: chatRoomMembers.unreadCount,
        })
        .from(chatRoomMembers)
        .innerJoin(chatRooms, eq(chatRoomMembers.chatRoomId, chatRooms.id))
        .where(eq(chatRoomMembers.userId, ctx.user.id))
        .orderBy(desc(chatRooms.lastMessageAt));

      return rooms;
    }),

    getMessages: protectedProcedure
      .input(
        z.object({
          chatRoomId: z.number(),
          limit: z.number().optional().default(50),
          before: z.date().optional(),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];

        return db
          .select()
          .from(messages)
          .where(eq(messages.chatRoomId, input.chatRoomId))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit);
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          chatRoomId: z.number(),
          content: z.string().min(1),
          messageType: z.enum(["text", "image", "song"]).optional().default("text"),
          metadata: z
            .object({
              songId: z.string().optional(),
              songName: z.string().optional(),
              artistName: z.string().optional(),
              imageUrl: z.string().optional(),
            })
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        await db.insert(messages).values({
          chatRoomId: input.chatRoomId,
          senderId: ctx.user.id,
          content: input.content,
          messageType: input.messageType,
          metadata: input.metadata ?? null,
        });

        // Update last message time
        await db
          .update(chatRooms)
          .set({ lastMessageAt: new Date() })
          .where(eq(chatRooms.id, input.chatRoomId));

        // Increment unread for other members
        await db
          .update(chatRoomMembers)
          .set({ unreadCount: sql`${chatRoomMembers.unreadCount} + 1` })
          .where(
            and(
              eq(chatRoomMembers.chatRoomId, input.chatRoomId),
              sql`${chatRoomMembers.userId} != ${ctx.user.id}`,
            ),
          );

        return { success: true };
      }),

    markRead: protectedProcedure
      .input(z.object({ chatRoomId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        await db
          .update(chatRoomMembers)
          .set({ unreadCount: 0, lastReadAt: new Date() })
          .where(
            and(
              eq(chatRoomMembers.chatRoomId, input.chatRoomId),
              eq(chatRoomMembers.userId, ctx.user.id),
            ),
          );

        return { success: true };
      }),
  }),

  // ============================================================
  // 音樂基因 API
  // ============================================================
  musicProfile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(musicProfiles)
        .where(eq(musicProfiles.userId, ctx.user.id))
        .limit(1);
      return result[0] ?? null;
    }),

    update: protectedProcedure
      .input(
        z.object({
          topArtists: z.array(z.string()).optional(),
          topGenres: z.array(z.string()).optional(),
          audioFeatures: z
            .object({
              danceability: z.number(),
              energy: z.number(),
              valence: z.number(),
              acousticness: z.number(),
              instrumentalness: z.number(),
            })
            .optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        const existing = await db
          .select()
          .from(musicProfiles)
          .where(eq(musicProfiles.userId, ctx.user.id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(musicProfiles)
            .set({
              topArtists: input.topArtists ?? null,
              topGenres: input.topGenres ?? null,
              audioFeatures: input.audioFeatures ?? null,
              lastUpdated: new Date(),
            })
            .where(eq(musicProfiles.userId, ctx.user.id));
        } else {
          await db.insert(musicProfiles).values({
            userId: ctx.user.id,
            topArtists: input.topArtists ?? null,
            topGenres: input.topGenres ?? null,
            audioFeatures: input.audioFeatures ?? null,
          });
        }

        return { success: true };
      }),
  }),

  // ============================================================
  // 用戶資料 API
  // ============================================================
  profile: router({
    update: protectedProcedure
      .input(
        z.object({
          nickname: z.string().optional(),
          avatar: z.string().optional(),
          age: z.number().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          bio: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        const updateData: Record<string, unknown> = {};
        if (input.nickname !== undefined) updateData.nickname = input.nickname;
        if (input.avatar !== undefined) updateData.avatar = input.avatar;
        if (input.age !== undefined) updateData.age = input.age;
        if (input.gender !== undefined) updateData.gender = input.gender;
        if (input.bio !== undefined) updateData.bio = input.bio;

        if (Object.keys(updateData).length > 0) {
          await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));
        }

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
