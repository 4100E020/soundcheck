# SoundCheck 活動爬蟲系統

## 概述

本系統從 KKTIX 等售票平台爬取音樂活動數據,並標準化存儲到資料庫中。

## 已完成功能

### 1. KKTIX 爬蟲 (`kktix-scraper.ts`)

**核心功能**:
- ✅ 從組織的 Atom Feed 爬取活動數據
- ✅ 使用 LLM 提取活動詳細信息 (場地、票價、陣容等)
- ✅ 標準化活動數據格式
- ✅ 計算數據質量評分
- ✅ 支援批量爬取多個組織

**內建音樂組織列表**:
```typescript
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
```

## 使用方式

### 手動執行爬蟲

```typescript
import { scrapeAllMusicEvents, scrapeOrganizationEvents } from "./server/scrapers/kktix-scraper";

// 爬取所有內建音樂組織的活動
const allEvents = await scrapeAllMusicEvents();
console.log(`Scraped ${allEvents.length} events`);

// 爬取特定組織的活動
const events = await scrapeOrganizationEvents("streetvoice");
console.log(`Scraped ${events.length} events from StreetVoice`);
```

### 整合到 API

在 `server/routers.ts` 中添加爬蟲端點:

```typescript
import { scrapeAllMusicEvents, scrapeOrganizationEvents } from "./scrapers/kktix-scraper";
import { db } from "./db";
import { standardizedEvents } from "../drizzle/schema";

export const appRouter = router({
  // ... 現有路由
  
  // 手動觸發爬蟲
  scraper: {
    scrapeKKTIX: protectedProcedure
      .input(z.object({
        organizationId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const events = input.organizationId
          ? await scrapeOrganizationEvents(input.organizationId)
          : await scrapeAllMusicEvents();
        
        // 存儲到資料庫
        for (const event of events) {
          await saveStandardizedEvent(event);
        }
        
        return { success: true, count: events.length };
      }),
  },
});
```

### 設置定時任務

使用 node-cron 定期執行爬蟲:

```typescript
// server/jobs/scraper-job.ts
import cron from "node-cron";
import { scrapeAllMusicEvents } from "../scrapers/kktix-scraper";
import { saveStandardizedEvent } from "../db";

// 每天凌晨 2 點執行
cron.schedule("0 2 * * *", async () => {
  console.log("Starting daily scraper job...");
  
  try {
    const events = await scrapeAllMusicEvents();
    
    for (const event of events) {
      await saveStandardizedEvent(event);
    }
    
    console.log(`Scraper job completed: ${events.length} events processed`);
  } catch (error) {
    console.error("Scraper job failed:", error);
  }
});
```

## 數據結構

### 標準化活動格式

```typescript
interface StandardizedEvent {
  id: string;                    // UUID
  sourceId: string;              // KKTIX 活動 ID
  source: "kktix";               // 數據來源
  sourceUrl: string;             // 原始 URL
  
  title: string;                 // 活動標題
  description: string;           // 純文本描述
  descriptionHtml?: string;      // HTML 描述
  summary?: string;              // 摘要
  
  startDate: Date;               // 開始時間
  endDate: Date;                 // 結束時間
  publishedAt: Date;             // 發布時間
  updatedAt: Date;               // 更新時間
  
  venue: {                       // 場地信息
    name: string;
    address: string;
    city: string;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  
  ticketing: {                   // 票務信息
    status: string;
    priceRange: {
      min: number;
      max: number;
      currency: string;
    };
    isFree: boolean;
  };
  
  category: string;              // 活動分類
  tags: string[];                // 標籤
  genres: string[];              // 音樂類型
  
  organizer: {                   // 主辦方
    name: string;
    organizationId?: string;
  };
  
  images: Array<{                // 圖片
    url: string;
    type: string;
  }>;
  
  lineup?: Array<{               // 陣容
    name: string;
    role?: string;
    order?: number;
  }>;
  
  metadata: {                    // 元數據
    scrapedAt: Date;
    lastCheckedAt: Date;
    version: number;
    isActive: boolean;
    qualityScore?: number;
  };
}
```

## 待完成功能

### 1. 資料庫整合
- [ ] 實作 `saveStandardizedEvent` 函數
- [ ] 添加去重邏輯 (基於 source + sourceId)
- [ ] 實作增量更新

### 2. 其他平台爬蟲
- [ ] iNDIEVOX 爬蟲
- [ ] Accupass 爬蟲
- [ ] Tixcraft 爬蟲

### 3. 數據增強
- [ ] 使用 Google Maps API 獲取精確座標
- [ ] 圖片下載與存儲到 S3
- [ ] 藝人信息擴充

### 4. 監控與維護
- [ ] 爬蟲失敗通知
- [ ] 數據質量監控
- [ ] 定期清理過期活動

## 技術細節

### LLM 提取

使用內建的 LLM 服務提取結構化信息:
- 場地名稱與地址
- 票價範圍
- 活動分類
- 音樂類型
- 演出陣容

### 錯誤處理

- 網絡請求失敗:跳過該組織,繼續下一個
- LLM 提取失敗:使用默認值
- 請求頻率限制:每個組織之間間隔 1 秒

### 數據質量評分

基於以下因素計算 0-100 分:
- 必填字段完整性 (40%)
- 重要字段完整性 (30%)
- 額外字段豐富度 (30%)

## 相關文檔

- [KKTIX 研究報告](../../KKTIX_RESEARCH.md)
- [活動數據標準化規範](../../EVENT_DATA_STANDARD.md)
- [流程審計報告](../../FLOW_AUDIT.md)
- [後端整合指南](../../BACKEND_INTEGRATION_GUIDE.md)

## 法律與倫理

- ✅ 使用官方 Atom Feed (公開數據)
- ✅ 請求頻率限制 (1 req/sec)
- ✅ 標註數據來源
- ⚠️ 僅用於應用程式內部,不公開分享
