/**
 * KKTIX 活動爬蟲
 * 
 * 從 KKTIX 組織的 Atom Feed 爬取活動數據並標準化
 */
import axios from "axios";
import { parseStringPromise } from "xml2js";
import { invokeLLM } from "../\_core/llm";
import { getVenueCoordinates } from "./venue-database";

// 音樂相關組織 ID 列表
const MUSIC_ORGANIZATIONS = [
  "streetvoice",      // StreetVoice
  "thewall",          // The Wall
  "legacy",           // Legacy
  "riverside",        // Riverside
  "bluenote",         // Blue Note Taipei
  "eslite",           // 誠品音樂
  "indievox",         // iNDIEVOX
  "ticketplus",       // Ticket Plus
  "musicmatters",     // Music Matters
  "taipeiarena",      // 台北小巨蛋
  "ticc",             // 台北國際會議中心
];

/**
 * KKTIX Atom Feed 數據結構
 */
interface KKTIXFeedEntry {
  title: string[];
  link: Array<{ $: { href: string } }>;
  id: string[];
  published: string[];
  updated: string[];
  author: Array<{ name: string[] }>;
  summary?: string[];
  content: Array<{ _: string; $: { type: string } }>;
}

interface KKTIXFeed {
  feed: {
    title: string[];
    link: Array<{ $: { href: string; rel: string } }>;
    id: string[];
    updated: string[];
    entry: KKTIXFeedEntry[];
  };
}

/**
 * 標準化活動數據結構
 */
export interface StandardizedEvent {
  id: string;
  sourceId: string;
  source: "kktix";
  sourceUrl: string;
  
  title: string;
  description: string;
  descriptionHtml?: string;
  summary?: string;
  
  startDate: Date;
  endDate: Date;
  publishedAt: Date;
  updatedAt: Date;
  
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
  
  category: string;
  tags: string[];
  genres: string[];
  
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
    rawData?: any;
  };
}

/**
 * 獲取組織的 Atom Feed
 */
async function fetchOrganizationFeed(organizationId: string): Promise<KKTIXFeed | null> {
  try {
    const feedUrl = `https://${organizationId}.kktix.cc/events.atom?locale=zh-TW`;
    console.log(`Fetching feed from: ${feedUrl}`);
    
    const response = await axios.get(feedUrl, {
      timeout: 10000,
      headers: {
        "User-Agent": "SoundCheck Event Scraper/1.0",
      },
    });
    
    const feed = await parseStringPromise(response.data);
    return feed as KKTIXFeed;
  } catch (error: any) {
    console.error(`Failed to fetch feed for ${organizationId}:`, error.message);
    return null;
  }
}

/**
 * 從 HTML 內容中提取純文本
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 從 URL 提取活動 ID
 */
function extractEventId(url: string): string {
  const match = url.match(/\/events\/([^\/\?]+)/);
  return match ? match[1] : "";
}

/**
 * 從 URL 提取組織 ID
 */
function extractOrganizationId(url: string): string {
  const match = url.match(/https?:\/\/([^\.]+)\.kktix\.cc/);
  return match ? match[1] : "";
}

/**
 * 使用 LLM 提取活動詳細信息
 */
async function extractEventDetails(content: string): Promise<{
  venue: any;
  ticketing: any;
  category: string;
  genres: string[];
  lineup: any[];
  startDate: Date;
  endDate: Date;
}> {
  const prompt = `
請從以下活動內容中提取信息,以 JSON 格式返回:

活動內容:
${content.substring(0, 3000)} 

請提取:
1. venue: 場地信息
   - name: 場地名稱
   - address: 完整地址
   - city: 城市 (台北/台中/高雄等)
   - district: 區域 (如: 大安區)

2. ticketing: 票務信息
   - isFree: 是否免費 (boolean)
   - minPrice: 最低票價 (數字,如果免費則為 0)
   - maxPrice: 最高票價 (數字,如果免費則為 0)
   - status: 票務狀態 (on_sale/sold_out/coming_soon)

3. category: 活動分類 (concert/festival/live_music/dj_set/club_event/workshop/party/other)

4. genres: 音樂類型數組 (如: ["indie", "rock", "electronic"])

5. lineup: 演出陣容數組,每個包含:
   - name: 藝人名稱
   - role: 角色 (如: 主唱、DJ、嘉賓)
   - order: 出場順序

6. startDate: 活動開始時間 (ISO 8601 格式)
7. endDate: 活動結束時間 (ISO 8601 格式)

如果某些信息無法提取,請返回 null 或空數組。
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一個專業的活動信息提取助手。請嚴格按照 JSON 格式返回數據。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const extracted = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    
    // 嘗試從場地資料庫查詢座標
    let venueLocation = { latitude: 25.0330, longitude: 121.5654 };
    if (extracted.venue?.name) {
      const venueCoords = getVenueCoordinates(extracted.venue.name);
      if (venueCoords) {
        venueLocation = { latitude: venueCoords.latitude, longitude: venueCoords.longitude };
        console.log(`Found venue coordinates: ${extracted.venue.name} (${venueLocation.latitude}, ${venueLocation.longitude})`);
      } else {
        console.log(`Venue not in database: ${extracted.venue.name}, using default coordinates`);
      }
    }

    return {
      venue: extracted.venue
        ? {
            ...extracted.venue,
            location: venueLocation,
          }
        : {
            name: "待確認",
            address: "",
            city: "台北",
            location: { latitude: 25.0330, longitude: 121.5654 },
          },
      ticketing: {
        status: extracted.ticketing?.status || "on_sale",
        priceRange: {
          min: extracted.ticketing?.minPrice || 0,
          max: extracted.ticketing?.maxPrice || 0,
          currency: "TWD",
        },
        isFree: extracted.ticketing?.isFree || false,
        ticketPlatform: "KKTIX",
      },
      category: extracted.category || "other",
      genres: extracted.genres || [],
      lineup: extracted.lineup || [],
      startDate: extracted.startDate ? new Date(extracted.startDate) : new Date(),
      endDate: extracted.endDate ? new Date(extracted.endDate) : new Date(),
    };
  } catch (error) {
    console.error("Failed to extract event details with LLM:", error);
    
      // 返回默認值
    return {
      venue: {
        name: "待確認",
        address: "",
        city: "台北",
        location: { latitude: 25.0330, longitude: 121.5654 },
      },
      ticketing: {
        status: "on_sale",
        priceRange: { min: 0, max: 0, currency: "TWD" },
        isFree: false,
        ticketPlatform: "KKTIX",
      },
      category: "other",
      genres: [],
      lineup: [],
      startDate: new Date(),
      endDate: new Date(),
    };
  }
}

/**
 * 從 HTML 內容中提取圖片
 */
function extractImages(html: string): Array<{ url: string; type: string }> {
  const images: Array<{ url: string; type: string }> = [];
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    // 過濾掉小圖標和追蹤像素
    if (!url.includes("icon") && !url.includes("pixel") && !url.includes("tracking")) {
      images.push({
        url: url,
        type: images.length === 0 ? "cover" : "gallery",
      });
    }
  }
  
  return images;
}

/**
 * 生成 UUID
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 計算數據質量評分
 */
function calculateQualityScore(event: StandardizedEvent): number {
  let score = 0;
  
  // 必填字段 (40分)
  if (event.title) score += 10;
  if (event.description) score += 10;
  if (event.startDate) score += 10;
  if (event.venue.name !== "待確認") score += 10;
  
  // 重要字段 (30分)
  if (event.venue?.location?.latitude && event.venue?.location?.longitude) score += 10;
  if (event.ticketing.priceRange.min > 0 || event.ticketing.isFree) score += 10;
  if (event.images.length > 0) score += 10;
  
  // 額外字段 (30分)
  if (event.lineup && event.lineup.length > 0) score += 10;
  if (event.genres.length > 0) score += 10;
  if (event.category !== "other") score += 10;
  
  return score;
}

/**
 * 轉換 KKTIX Feed Entry 為標準化活動
 */
async function transformKKTIXEvent(
  entry: KKTIXFeedEntry,
  organizationId: string
): Promise<StandardizedEvent> {
  const url = entry.link[0].$.href;
  const contentHtml = entry.content?.[0]?._ || "";
  const contentText = stripHtml(contentHtml);
  
  // 使用 LLM 提取詳細信息
  const details = await extractEventDetails(contentText);
  
  const event: StandardizedEvent = {
    id: generateUUID(),
    sourceId: extractEventId(url),
    source: "kktix",
    sourceUrl: url,
    
    title: entry.title[0],
    description: contentText,
    descriptionHtml: contentHtml,
    summary: typeof entry.summary?.[0] === 'string' ? entry.summary[0] : (entry.summary?.[0] as any)?._  || '',
    
    startDate: details.startDate,
    endDate: details.endDate,
    publishedAt: new Date(entry.published[0]),
    updatedAt: new Date(entry.updated[0]),
    
    venue: details.venue,
    ticketing: details.ticketing,
    
    category: details.category,
    tags: [],
    genres: details.genres,
    
    organizer: {
      name: entry.author[0].name[0],
      organizationId: organizationId,
    },
    
    images: extractImages(contentHtml),
    lineup: details.lineup,
    
    metadata: {
      scrapedAt: new Date(),
      lastCheckedAt: new Date(),
      version: 1,
      isActive: true,
      rawData: entry,
    },
  };
  
  // 計算質量評分
  event.metadata.qualityScore = calculateQualityScore(event);
  
  return event;
}

/**
 * 爬取單個組織的活動
 */
export async function scrapeOrganizationEvents(
  organizationId: string
): Promise<StandardizedEvent[]> {
  console.log(`Scraping events from organization: ${organizationId}`);
  
  const feed = await fetchOrganizationFeed(organizationId);
  if (!feed || !feed.feed.entry) {
    console.log(`No events found for organization: ${organizationId}`);
    return [];
  }
  
  const events: StandardizedEvent[] = [];
  
  for (const entry of feed.feed.entry) {
    try {
      const event = await transformKKTIXEvent(entry, organizationId);
      events.push(event);
      console.log(`✓ Scraped: ${event.title}`);
    } catch (error) {
      console.error(`Failed to transform event: ${entry.title[0]}`, error);
    }
  }
  
  console.log(`Scraped ${events.length} events from ${organizationId}`);
  return events;
}

/**
 * 爬取所有音樂組織的活動
 */
export async function scrapeAllMusicEvents(): Promise<StandardizedEvent[]> {
  console.log(`Starting to scrape ${MUSIC_ORGANIZATIONS.length} music organizations...`);
  
  const allEvents: StandardizedEvent[] = [];
  
  for (const orgId of MUSIC_ORGANIZATIONS) {
    try {
      const events = await scrapeOrganizationEvents(orgId);
      allEvents.push(...events);
      
      // 避免請求過於頻繁
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scrape organization ${orgId}:`, error);
    }
  }
  
  console.log(`Total scraped events: ${allEvents.length}`);
  return allEvents;
}

/**
 * 爬取特定組織列表的活動
 */
export async function scrapeCustomOrganizations(
  organizationIds: string[]
): Promise<StandardizedEvent[]> {
  console.log(`Scraping ${organizationIds.length} custom organizations...`);
  
  const allEvents: StandardizedEvent[] = [];
  
  for (const orgId of organizationIds) {
    try {
      const events = await scrapeOrganizationEvents(orgId);
      allEvents.push(...events);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to scrape organization ${orgId}:`, error);
    }
  }
  
  return allEvents;
}
