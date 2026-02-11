/**
 * iNDIEVOX 活動爬蟲
 * 
 * 從 iNDIEVOX 網站爬取音樂活動數據並標準化
 * iNDIEVOX 是台灣最大的獨立音樂售票平台之一
 */
import axios from "axios";
import * as cheerio from "cheerio";
import { invokeLLM } from "../_core/llm";
import { getVenueCoordinates } from "./venue-database";
import type { StandardizedEventData } from "./event-storage";

/**
 * iNDIEVOX 活動列表項目
 */
interface IndievoxListItem {
  id: string;
  title: string;
  date: string;
  url: string;
  imageUrl?: string;
}

/**
 * iNDIEVOX 活動詳情
 */
interface IndievoxEventDetail {
  title: string;
  description: string;
  descriptionHtml: string;
  imageUrl?: string;
  date: string;
  rawContent: string;
}

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * 獲取 iNDIEVOX 活動列表頁面
 */
async function fetchEventList(): Promise<IndievoxListItem[]> {
  try {
    const url = "https://www.indievox.com/activity/list";
    console.log(`[iNDIEVOX] Fetching event list from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    });

    const $ = cheerio.load(response.data);
    const items: IndievoxListItem[] = [];

    // 解析活動列表中的連結
    $('a[href*="/activity/detail/"]').each((_i: number, el: any) => {
      const href = $(el).attr("href") || "";
      const title = $(el).find("h5, h4, .title, .event-title").text().trim() || $(el).text().trim();
      const dateText = $(el).find(".date, time, .event-date").text().trim();
      const img = $(el).find("img").attr("src") || "";
      
      // 從 URL 提取 ID
      const idMatch = href.match(/\/activity\/detail\/([^\/\?]+)/);
      const id = idMatch ? idMatch[1] : "";

      if (id && title && !items.find(item => item.id === id)) {
        items.push({
          id,
          title: title.substring(0, 200),
          date: dateText,
          url: href.startsWith("http") ? href : `https://www.indievox.com${href}`,
          imageUrl: img.startsWith("http") ? img : img ? `https://www.indievox.com${img}` : undefined,
        });
      }
    });

    console.log(`[iNDIEVOX] Found ${items.length} events in list`);
    return items;
  } catch (error: any) {
    console.error("[iNDIEVOX] Failed to fetch event list:", error.message);
    return [];
  }
}

/**
 * 獲取單個活動的詳細頁面
 */
async function fetchEventDetail(item: IndievoxListItem): Promise<IndievoxEventDetail | null> {
  try {
    console.log(`[iNDIEVOX] Fetching detail: ${item.title}`);
    
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
    const descriptionHtml = $(".tab-pane.active, .event-info, .activity-content, #activityInfo").html() || "";
    const description = $(".tab-pane.active, .event-info, .activity-content, #activityInfo").text().trim();
    
    // 提取圖片 - 優先從 Open Graph meta tag
    let imageUrl = $("meta[property='og:image']").attr("content");
    
    // 如果沒有 og:image，嘗試從各種可能的圖片元素提取
    if (!imageUrl) {
      imageUrl = $(".event-poster img").attr("src")
        || $(".activity-poster img").attr("src")
        || $(".main-image img").attr("src")
        || $("img[src*='activity']").first().attr("src")
        || $("img[src*='indievox.static']").first().attr("src")
        || $("img[src*='tixcraft']").first().attr("src")
        || item.imageUrl;
    }
    
    // 如果圖片 URL 不是完整的，补上 domain
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') 
        ? `https://www.indievox.com${imageUrl}`
        : `https://www.indievox.com/${imageUrl}`;
    }
    
    if (imageUrl) {
      console.log(`[iNDIEVOX] Found image: ${imageUrl}`);
    }

    return {
      title: item.title,
      description: description || item.title,
      descriptionHtml,
      imageUrl: imageUrl?.startsWith("http") ? imageUrl : imageUrl ? `https://www.indievox.com${imageUrl}` : undefined,
      date: item.date,
      rawContent: description.substring(0, 5000),
    };
  } catch (error: any) {
    console.error(`[iNDIEVOX] Failed to fetch detail for ${item.title}:`, error.message);
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
請從以下 iNDIEVOX 活動內容中提取信息,以 JSON 格式返回:

活動標題: ${title}
活動內容:
${content.substring(0, 3000)}

請提取:
1. venue: 場地信息
   - name: 場地名稱 (如: Legacy Taipei, The Wall, SUB, 迴響 等)
   - address: 完整地址 (如果有)
   - city: 城市 (台北/台中/高雄等)
   - district: 區域 (如: 大安區)

2. ticketing: 票務信息
   - isFree: 是否免費 (boolean)
   - minPrice: 最低票價 (數字,如果免費則為 0)
   - maxPrice: 最高票價 (數字,如果免費則為 0)
   - status: 票務狀態 (on_sale/sold_out/coming_soon)

3. category: 活動分類 (concert/festival/live_music/dj_set/club_event/workshop/party/other)

4. genres: 音樂類型數組 (如: ["indie", "rock", "electronic", "metal", "punk", "jazz", "hip-hop", "folk"])

5. lineup: 演出陣容數組,每個包含:
   - name: 藝人/樂團名稱
   - role: 角色 (如: 主唱、DJ、嘉賓)
   - order: 出場順序

6. startDate: 活動開始時間 (ISO 8601 格式, 如 2026-02-13T20:00:00+08:00)
7. endDate: 活動結束時間 (ISO 8601 格式)

如果某些信息無法提取,請返回 null 或空數組。
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "你是一個專業的台灣音樂活動信息提取助手。請嚴格按照 JSON 格式返回數據。注意台灣時區為 UTC+8。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0].message.content;
    const extracted = JSON.parse(typeof responseContent === "string" ? responseContent : JSON.stringify(responseContent));

    // 嘗試從場地資料庫查詢座標
    let venueLocation = { latitude: 25.0330, longitude: 121.5654 };
    if (extracted.venue?.name) {
      const venueCoords = getVenueCoordinates(extracted.venue.name);
      if (venueCoords) {
        venueLocation = { latitude: venueCoords.latitude, longitude: venueCoords.longitude };
        console.log(`[iNDIEVOX] Found venue coordinates: ${extracted.venue.name}`);
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
        ticketPlatform: "iNDIEVOX",
      },
      category: extracted.category || "live_music",
      genres: extracted.genres || [],
      lineup: extracted.lineup || [],
      startDate: extracted.startDate ? new Date(extracted.startDate) : new Date(),
      endDate: extracted.endDate ? new Date(extracted.endDate) : new Date(),
    };
  } catch (error) {
    console.error("[iNDIEVOX] Failed to extract event details with LLM:", error);
    return {
      venue: { name: "待確認", address: "", city: "台北", location: { latitude: 25.0330, longitude: 121.5654 } },
      ticketing: { status: "on_sale", priceRange: { min: 0, max: 0, currency: "TWD" }, isFree: false, ticketPlatform: "iNDIEVOX" },
      category: "live_music",
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
async function transformIndievoxEvent(
  item: IndievoxListItem,
  detail: IndievoxEventDetail
): Promise<StandardizedEventData> {
  const extracted = await extractEventDetails(detail.rawContent, detail.title);

  const images: Array<{ url: string; type: string }> = [];
  if (detail.imageUrl) {
    images.push({ url: detail.imageUrl, type: "cover" });
  }

  return {
    sourceId: item.id,
    source: "indievox",
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
    tags: ["indievox", "taiwan", "live"],
    genres: extracted.genres,
    organizer: {
      name: "iNDIEVOX",
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
 * 爬取 iNDIEVOX 所有活動
 */
export async function scrapeIndievoxEvents(): Promise<StandardizedEventData[]> {
  console.log("[iNDIEVOX] Starting scrape...");

  const listItems = await fetchEventList();
  if (listItems.length === 0) {
    console.log("[iNDIEVOX] No events found");
    return [];
  }

  const events: StandardizedEventData[] = [];

  // 限制同時爬取數量,避免過於頻繁
  const maxEvents = 20;
  const itemsToScrape = listItems.slice(0, maxEvents);

  const now = new Date();
  
  for (const item of itemsToScrape) {
    try {
      const detail = await fetchEventDetail(item);
      if (detail) {
        const event = await transformIndievoxEvent(item, detail);
        
        // 只保留未來的活動
        if (event.endDate > now) {
          events.push(event);
          console.log(`[iNDIEVOX] ✓ Scraped: ${event.title}`);
        } else {
          console.log(`[iNDIEVOX] ⊘ Skipped (past event): ${event.title}`);
        }
      }
      // 避免請求過於頻繁
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error: any) {
      console.error(`[iNDIEVOX] Failed to scrape: ${item.title}`, error.message);
    }
  }

  console.log(`[iNDIEVOX] Total scraped: ${events.length} events`);
  return events;
}
