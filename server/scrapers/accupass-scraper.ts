/**
 * Accupass 活動爬蟲
 * 
 * 從 Accupass 網站爬取音樂活動數據並標準化
 * Accupass 是台灣最大的活動平台之一,涵蓋各類音樂演出
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { invokeLLM } from "../_core/llm";
import { getVenueCoordinates } from "./venue-database";
import type { StandardizedEventData } from "./event-storage";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// 音樂相關搜尋關鍵字
const MUSIC_SEARCH_QUERIES = [
  "演唱會", "音樂會", "音樂節", "live house", "live music",
  "搖滾", "流行音樂", "獨立音樂", "民謠", "爭士",
  "DJ", "電子音樂", "EDM", "techno", "house music",
  "嘉年華", "跨年", "春天呕啦", "貢寮",
  "古典音樂", "交響樂", "室內樂", "歌劇",
];

interface AccupassListItem {
  id: string;
  title: string;
  date: string;
  location: string;
  url: string;
  imageUrl?: string;
  tags: string[];
}

/**
 * 搜尋 Accupass 音樂活動
 */
async function searchAccupassEvents(query: string): Promise<AccupassListItem[]> {
  try {
    const searchUrl = `https://www.accupass.com/search?q=${encodeURIComponent(query)}&category=4`;
    console.log(`[Accupass] Searching: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(response.data);
    const items: AccupassListItem[] = [];

    // 解析搜尋結果中的活動連結
    $('a[href*="/event/"]').each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      const title = $(el).text().trim();
      
      // 從 URL 提取活動 ID
      const idMatch = href.match(/\/event\/([^\/\?\&]+)/);
      const id = idMatch ? idMatch[1] : "";

      if (id && title && title.length > 3 && !items.find(item => item.id === id)) {
        // 清理 URL
        const cleanUrl = `https://www.accupass.com/event/${id}`;
        
        items.push({
          id,
          title: title.substring(0, 200),
          date: "",
          location: "",
          url: cleanUrl,
          tags: [query],
        });
      }
    });

    console.log(`[Accupass] Found ${items.length} events for query: ${query}`);
    return items;
  } catch (error: any) {
    console.error(`[Accupass] Search failed for "${query}":`, error.message);
    return [];
  }
}

/**
 * 獲取 Accupass 活動詳情
 */
async function fetchAccupassDetail(item: AccupassListItem): Promise<{
  title: string;
  description: string;
  descriptionHtml: string;
  imageUrl?: string;
  rawContent: string;
} | null> {
  try {
    console.log(`[Accupass] Fetching detail: ${item.title}`);

    const response = await axios.get(item.url, {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(response.data);

    // 提取活動描述
    const descriptionHtml = $(".event-content, .event-description, .activity-content, article").html() || "";
    const description = $(".event-content, .event-description, .activity-content, article").text().trim();

    // 提取圖片 - 優先從 Open Graph meta tag
    let imageUrl = $("meta[property='og:image']").attr("content");
    
    // 如果沒有 og:image，嘗試從 twitter:image
    if (!imageUrl) {
      imageUrl = $("meta[name='twitter:image']").attr("content");
    }
    
    // 如果還是沒有，嘗試從各種可能的圖片元素提取
    if (!imageUrl) {
      imageUrl = $(".event-banner img").attr("src")
        || $(".event-cover img").attr("src")
        || $("img[alt='event-banner']").attr("src")
        || $("img[src*='eventbanner']").first().attr("src")
        || $("img[src*='static.accupass']").first().attr("src");
    }
    
    // 如果圖片 URL 不是完整的，补上 domain
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') 
        ? `https://www.accupass.com${imageUrl}`
        : `https://www.accupass.com/${imageUrl}`;
    }
    
    if (imageUrl) {
      console.log(`[Accupass] Found image: ${imageUrl}`);
    }

    // 提取頁面所有文字作為 raw content
    const rawContent = $("body").text().replace(/\s+/g, " ").trim();

    return {
      title: $("meta[property='og:title']").attr("content") || item.title,
      description: description || rawContent.substring(0, 2000),
      descriptionHtml,
      imageUrl,
      rawContent: rawContent.substring(0, 5000),
    };
  } catch (error: any) {
    console.error(`[Accupass] Failed to fetch detail for ${item.title}:`, error.message);
    return null;
  }
}

/**
 * 使用 LLM 提取活動詳細信息
 */
async function extractEventDetails(content: string, title: string): Promise<{
  venue: any;
  ticketing: any;
  category: string;
  genres: string[];
  lineup: any[];
  startDate: Date;
  endDate: Date;
}> {
  const prompt = `
請從以下 Accupass 活動內容中提取信息,以 JSON 格式返回:

活動標題: ${title}
活動內容:
${content.substring(0, 3000)}

請提取:
1. venue: 場地信息
   - name: 場地名稱
   - address: 完整地址
   - city: 城市 (台北/台中/高雄等)
   - district: 區域

2. ticketing: 票務信息
   - isFree: 是否免費 (boolean)
   - minPrice: 最低票價 (數字)
   - maxPrice: 最高票價 (數字)
   - status: 票務狀態 (on_sale/sold_out/coming_soon)

3. category: 活動分類 (concert/festival/live_music/dj_set/club_event/workshop/conference/party/other)

4. genres: 音樂類型數組

5. lineup: 演出陣容數組

6. startDate: 活動開始時間 (ISO 8601 格式, 台灣時區 UTC+8)
7. endDate: 活動結束時間 (ISO 8601 格式)

如果某些信息無法提取,請返回 null 或空數組。
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一個專業的台灣活動信息提取助手。請嚴格按照 JSON 格式返回數據。",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content;
    const extracted = JSON.parse(typeof responseContent === "string" ? responseContent : JSON.stringify(responseContent));

    let venueLocation = { latitude: 25.0330, longitude: 121.5654 };
    if (extracted.venue?.name) {
      const venueCoords = getVenueCoordinates(extracted.venue.name);
      if (venueCoords) {
        venueLocation = { latitude: venueCoords.latitude, longitude: venueCoords.longitude };
      }
    }

    return {
      venue: extracted.venue
        ? { ...extracted.venue, location: venueLocation }
        : { name: "待確認", address: "", city: "台北", location: venueLocation },
      ticketing: {
        status: extracted.ticketing?.status || "on_sale",
        priceRange: {
          min: extracted.ticketing?.minPrice || 0,
          max: extracted.ticketing?.maxPrice || 0,
          currency: "TWD",
        },
        isFree: extracted.ticketing?.isFree || false,
        ticketPlatform: "Accupass",
      },
      category: extracted.category || "other",
      genres: extracted.genres || [],
      lineup: extracted.lineup || [],
      startDate: extracted.startDate ? new Date(extracted.startDate) : new Date(),
      endDate: extracted.endDate ? new Date(extracted.endDate) : new Date(),
    };
  } catch (error) {
    console.error("[Accupass] Failed to extract event details with LLM:", error);
    return {
      venue: { name: "待確認", address: "", city: "台北", location: { latitude: 25.0330, longitude: 121.5654 } },
      ticketing: { status: "on_sale", priceRange: { min: 0, max: 0, currency: "TWD" }, isFree: false, ticketPlatform: "Accupass" },
      category: "other",
      genres: [],
      lineup: [],
      startDate: new Date(),
      endDate: new Date(),
    };
  }
}

/**
 * 轉換為標準化活動數據
 */
async function transformAccupassEvent(
  item: AccupassListItem,
  detail: { title: string; description: string; descriptionHtml: string; imageUrl?: string; rawContent: string }
): Promise<StandardizedEventData> {
  const extracted = await extractEventDetails(detail.rawContent, detail.title);

  const images: Array<{ url: string; type: string }> = [];
  if (detail.imageUrl) {
    images.push({ url: detail.imageUrl, type: "cover" });
  }

  return {
    sourceId: item.id,
    source: "accupass",
    sourceUrl: item.url,
    title: detail.title,
    description: detail.description,
    descriptionHtml: detail.descriptionHtml,
    summary: detail.description.substring(0, 200),
    startDate: extracted.startDate,
    endDate: extracted.endDate,
    publishedAt: new Date(),
    venue: extracted.venue,
    ticketing: {
      ...extracted.ticketing,
      ticketUrl: item.url,
    },
    category: extracted.category as StandardizedEventData["category"],
    tags: ["accupass", "taiwan", ...item.tags],
    genres: extracted.genres,
    organizer: {
      name: "Accupass",
    },
    images,
    lineup: extracted.lineup,
    metadata: {
      scrapedAt: new Date(),
      lastCheckedAt: new Date(),
      version: 1,
      isActive: true,
    },
  };
}

/**
 * 爬取 Accupass 音樂活動
 */
export async function scrapeAccupassEvents(): Promise<StandardizedEventData[]> {
  console.log("[Accupass] Starting scrape...");

  // 搜尋多個音樂相關關鍵字
  const allItems: AccupassListItem[] = [];
  const seenIds = new Set<string>();

  for (const query of MUSIC_SEARCH_QUERIES) {
    const items = await searchAccupassEvents(query);
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    }
    // 避免請求過於頻繁
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`[Accupass] Total unique events found: ${allItems.length}`);

  const events: StandardizedEventData[] = [];
  const maxEvents = 30; // 限制爬取數量
  const itemsToScrape = allItems.slice(0, maxEvents);

  const now = new Date();
  
  for (const item of itemsToScrape) {
    try {
      const detail = await fetchAccupassDetail(item);
      if (detail) {
        const event = await transformAccupassEvent(item, detail);
        
        // 只保留未來的活動
        if (event.endDate > now) {
          events.push(event);
          console.log(`[Accupass] ✓ Scraped: ${event.title}`);
        } else {
          console.log(`[Accupass] ⊘ Skipped (past event): ${event.title}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error: any) {
      console.error(`[Accupass] Failed to scrape: ${item.title}`, error.message);
    }
  }

  console.log(`[Accupass] Total scraped: ${events.length} events`);
  return events;
}
