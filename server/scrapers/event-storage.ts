import { getDb } from "../db";
import { standardizedEvents, type InsertStandardizedEvent } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export interface StandardizedEventData {
  sourceId: string;
  source: "kktix" | "indievox" | "accupass" | "tixcraft" | "ibon" | "manual";
  sourceUrl: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  summary?: string;
  startDate: Date;
  endDate: Date;
  publishedAt: Date;
  venue: {
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
  };
  ticketing: {
    status: string;
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    isFree: boolean;
    ticketUrl?: string;
    ticketPlatform?: string;
  };
  category: "concert" | "festival" | "club_event" | "live_music" | "dj_set" | "workshop" | "conference" | "party" | "other";
  tags?: string[];
  genres?: string[];
  organizer: {
    name: string;
    organizationId?: string;
  };
  images: Array<{
    url: string;
    type: string;
  }>;
  lineup?: Array<{
    name: string;
    role?: string;
    order?: number;
  }>;
  metadata: {
    scrapedAt: Date;
    lastCheckedAt: Date;
    version: number;
    isActive: boolean;
    qualityScore?: number;
  };
}

/**
 * 保存或更新標準化活動數據
 * 如果活動已存在 (基於 source + sourceId),則更新;否則插入新記錄
 */
export async function saveStandardizedEvent(eventData: StandardizedEventData): Promise<string> {
  try {
    // 檢查活動是否已存在
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const existing = await db
      .select()
      .from(standardizedEvents)
      .where(
        and(
          eq(standardizedEvents.source, eventData.source),
          eq(standardizedEvents.sourceId, eventData.sourceId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // 更新現有活動
      const eventId = existing[0].id;
      
      await db
        .update(standardizedEvents)
        .set({
          ...eventData,
          metadata: {
            ...eventData.metadata,
            version: existing[0].metadata.version + 1,
            lastCheckedAt: new Date(),
          },
          updatedAt: new Date(),
        })
        .where(eq(standardizedEvents.id, eventId));

      console.log(`Updated event: ${eventData.title} (${eventId})`);
      return eventId;
    } else {
      // 插入新活動
      const eventId = uuidv4();
      
      await db.insert(standardizedEvents).values({
        id: eventId,
        ...eventData,
      });

      console.log(`Inserted new event: ${eventData.title} (${eventId})`);
      return eventId;
    }
  } catch (error) {
    console.error(`Failed to save event: ${eventData.title}`, error);
    throw error;
  }
}

/**
 * 批量保存活動數據
 */
export async function saveStandardizedEvents(events: StandardizedEventData[]): Promise<{
  inserted: number;
  updated: number;
  failed: number;
}> {
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  for (const event of events) {
    try {
      const existing = await db
        .select()
        .from(standardizedEvents)
        .where(
          and(
            eq(standardizedEvents.source, event.source),
            eq(standardizedEvents.sourceId, event.sourceId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await saveStandardizedEvent(event);
        updated++;
      } else {
        await saveStandardizedEvent(event);
        inserted++;
      }
    } catch (error) {
      console.error(`Failed to save event: ${event.title}`, error);
      failed++;
    }
  }

  return { inserted, updated, failed };
}

/**
 * 標記過期活動為不活躍
 */
export async function deactivateExpiredEvents(): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const now = new Date();
  
  const result = await db
    .update(standardizedEvents)
    .set({
      metadata: {
        scrapedAt: new Date(),
        lastCheckedAt: now,
        version: 1,
        isActive: false,
      },
      updatedAt: now,
    })
    .where(eq(standardizedEvents.endDate, now));

  return 0; // Note: Drizzle doesn't return rowsAffected for MySQL
}
