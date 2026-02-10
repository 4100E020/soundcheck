# 活動數據標準化規範

## 目標

建立統一的活動數據結構,支援從多個售票平台 (KKTIX, iNDIEVOX, Accupass 等) 爬取的數據標準化存儲。

---

## 標準化數據結構

### 核心字段

```typescript
interface StandardizedEvent {
  // 基本信息
  id: string;                    // 內部唯一 ID (UUID)
  sourceId: string;              // 來源平台的活動 ID
  source: EventSource;           // 數據來源平台
  sourceUrl: string;             // 原始活動頁面 URL
  
  // 活動信息
  title: string;                 // 活動標題
  description: string;           // 活動描述 (純文本)
  descriptionHtml?: string;      // 活動描述 (HTML,可選)
  summary?: string;              // 活動摘要 (簡短描述)
  
  // 時間信息
  startDate: Date;               // 開始時間
  endDate: Date;                 // 結束時間
  publishedAt: Date;             // 發布時間
  updatedAt: Date;               // 最後更新時間
  
  // 地點信息
  venue: VenueInfo;              // 場地信息
  
  // 票務信息
  ticketing: TicketingInfo;      // 票務信息
  
  // 分類與標籤
  category: EventCategory;       // 活動分類
  tags: string[];                // 標籤
  genres: string[];              // 音樂類型 (如適用)
  
  // 主辦方信息
  organizer: OrganizerInfo;      // 主辦方信息
  
  // 媒體資源
  images: ImageInfo[];           // 活動圖片
  videos?: VideoInfo[];          // 活動視頻 (可選)
  
  // 陣容信息 (音樂活動)
  lineup?: LineupInfo[];         // 演出陣容 (可選)
  
  // 元數據
  metadata: EventMetadata;       // 爬蟲元數據
}
```

### 數據來源枚舉

```typescript
enum EventSource {
  KKTIX = 'kktix',
  INDIEVOX = 'indievox',
  ACCUPASS = 'accupass',
  TIXCRAFT = 'tixcraft',
  IBON = 'ibon',
  MANUAL = 'manual',              // 手動添加
}
```

### 場地信息

```typescript
interface VenueInfo {
  name: string;                   // 場地名稱
  address: string;                // 完整地址
  city: string;                   // 城市
  district?: string;              // 區域 (可選)
  location: {
    latitude: number;             // 緯度
    longitude: number;            // 經度
  };
  capacity?: number;              // 容納人數 (可選)
  venueType?: VenueType;          // 場地類型
}

enum VenueType {
  LIVE_HOUSE = 'live_house',      // Live House
  CONCERT_HALL = 'concert_hall',  // 音樂廳
  STADIUM = 'stadium',            // 體育場
  CLUB = 'club',                  // 夜店
  BAR = 'bar',                    // 酒吧
  OUTDOOR = 'outdoor',            // 戶外
  ONLINE = 'online',              // 線上活動
  OTHER = 'other',                // 其他
}
```

### 票務信息

```typescript
interface TicketingInfo {
  status: TicketStatus;           // 票務狀態
  priceRange: {
    min: number;                  // 最低票價
    max: number;                  // 最高票價
    currency: string;             // 貨幣 (預設 TWD)
  };
  isFree: boolean;                // 是否免費
  ticketUrl?: string;             // 購票連結
  ticketPlatform?: string;        // 售票平台
  salesStartDate?: Date;          // 開賣時間
  salesEndDate?: Date;            // 售票結束時間
}

enum TicketStatus {
  ON_SALE = 'on_sale',            // 售票中
  SOLD_OUT = 'sold_out',          // 已售完
  COMING_SOON = 'coming_soon',    // 即將開賣
  ENDED = 'ended',                // 已結束
  CANCELLED = 'cancelled',        // 已取消
}
```

### 活動分類

```typescript
enum EventCategory {
  CONCERT = 'concert',            // 演唱會
  FESTIVAL = 'festival',          // 音樂節
  CLUB_EVENT = 'club_event',      // 夜店活動
  LIVE_MUSIC = 'live_music',      // 現場演出
  DJ_SET = 'dj_set',              // DJ 演出
  WORKSHOP = 'workshop',          // 工作坊
  CONFERENCE = 'conference',      // 研討會
  PARTY = 'party',                // 派對
  OTHER = 'other',                // 其他
}
```

### 主辦方信息

```typescript
interface OrganizerInfo {
  name: string;                   // 主辦方名稱
  organizationId?: string;        // 組織 ID (來源平台)
  website?: string;               // 官方網站
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}
```

### 圖片信息

```typescript
interface ImageInfo {
  url: string;                    // 圖片 URL
  type: ImageType;                // 圖片類型
  width?: number;                 // 寬度
  height?: number;                // 高度
  alt?: string;                   // 替代文字
}

enum ImageType {
  COVER = 'cover',                // 封面圖
  POSTER = 'poster',              // 海報
  GALLERY = 'gallery',            // 相冊
  THUMBNAIL = 'thumbnail',        // 縮圖
}
```

### 陣容信息

```typescript
interface LineupInfo {
  name: string;                   // 藝人/樂團名稱
  role?: string;                  // 角色 (主唱、DJ 等)
  order?: number;                 // 出場順序
  performanceTime?: Date;         // 演出時間
  genre?: string[];               // 音樂類型
  image?: string;                 // 藝人圖片
}
```

### 爬蟲元數據

```typescript
interface EventMetadata {
  scrapedAt: Date;                // 爬取時間
  lastCheckedAt: Date;            // 最後檢查時間
  version: number;                // 數據版本
  isActive: boolean;              // 是否活躍
  qualityScore?: number;          // 數據質量評分 (0-100)
  rawData?: any;                  // 原始數據 (可選,用於調試)
}
```

---

## 數據轉換規則

### KKTIX → 標準格式

```typescript
function transformKKTIXEvent(kktixData: KKTIXEventData): StandardizedEvent {
  return {
    id: generateUUID(),
    sourceId: extractEventId(kktixData.url),
    source: EventSource.KKTIX,
    sourceUrl: kktixData.url,
    
    title: kktixData.title,
    description: stripHtml(kktixData.content),
    descriptionHtml: kktixData.content,
    summary: kktixData.summary,
    
    startDate: parseDate(kktixData.startDate),
    endDate: parseDate(kktixData.endDate),
    publishedAt: new Date(kktixData.published),
    updatedAt: new Date(kktixData.updated),
    
    venue: extractVenueFromContent(kktixData.content),
    ticketing: extractTicketingInfo(kktixData),
    
    category: inferCategory(kktixData.title, kktixData.content),
    tags: extractTags(kktixData.content),
    genres: extractGenres(kktixData.content),
    
    organizer: {
      name: kktixData.author,
      organizationId: kktixData.organizationId,
    },
    
    images: extractImages(kktixData.content),
    lineup: extractLineup(kktixData.content),
    
    metadata: {
      scrapedAt: new Date(),
      lastCheckedAt: new Date(),
      version: 1,
      isActive: true,
      rawData: kktixData,
    },
  };
}
```

### 數據提取策略

#### 1. 場地信息提取
```typescript
function extractVenueFromContent(content: string): VenueInfo {
  // 使用正則表達式或 LLM 提取
  // 常見模式:
  // - "地點: XXX"
  // - "場地: XXX"
  // - "Venue: XXX"
  
  // 使用 Google Maps Geocoding API 獲取座標
  const address = extractAddress(content);
  const coordinates = await geocodeAddress(address);
  
  return {
    name: extractVenueName(content),
    address: address,
    city: extractCity(address),
    location: coordinates,
  };
}
```

#### 2. 票價信息提取
```typescript
function extractTicketingInfo(data: any): TicketingInfo {
  // 從內容中提取票價
  // 常見模式:
  // - "票價: NT$ 500"
  // - "Price: TWD 500-1000"
  // - "免費入場"
  
  const prices = extractPrices(data.content);
  const isFree = checkIfFree(data.title, data.content);
  
  return {
    status: inferTicketStatus(data),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: 'TWD',
    },
    isFree: isFree,
    ticketUrl: data.url,
    ticketPlatform: 'KKTIX',
  };
}
```

#### 3. 分類推斷
```typescript
function inferCategory(title: string, content: string): EventCategory {
  // 使用關鍵字匹配或 LLM 分類
  const keywords = {
    [EventCategory.CONCERT]: ['演唱會', 'concert', '巡演'],
    [EventCategory.FESTIVAL]: ['音樂節', 'festival', '祭'],
    [EventCategory.LIVE_MUSIC]: ['live', '現場', '演出'],
    [EventCategory.DJ_SET]: ['DJ', 'dj set', '電音'],
    [EventCategory.CLUB_EVENT]: ['夜店', 'club', '派對'],
  };
  
  // 匹配關鍵字
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => title.includes(word) || content.includes(word))) {
      return category as EventCategory;
    }
  }
  
  return EventCategory.OTHER;
}
```

#### 4. 陣容提取
```typescript
function extractLineup(content: string): LineupInfo[] {
  // 使用 LLM 提取陣容信息
  // 常見模式:
  // - "演出陣容: A / B / C"
  // - "Lineup: Artist A, Artist B"
  // - 列表格式
  
  const prompt = `
    從以下活動內容中提取演出陣容信息:
    ${content}
    
    請以 JSON 格式返回,包含:
    - name: 藝人名稱
    - role: 角色 (如: 主唱、DJ、嘉賓)
    - order: 出場順序
  `;
  
  return await llmExtract(prompt);
}
```

---

## 數據質量評分

```typescript
function calculateQualityScore(event: StandardizedEvent): number {
  let score = 0;
  
  // 必填字段 (40分)
  if (event.title) score += 10;
  if (event.description) score += 10;
  if (event.startDate) score += 10;
  if (event.venue.name) score += 10;
  
  // 重要字段 (30分)
  if (event.venue.location.latitude) score += 10;
  if (event.ticketing.priceRange.min > 0) score += 10;
  if (event.images.length > 0) score += 10;
  
  // 額外字段 (30分)
  if (event.lineup && event.lineup.length > 0) score += 10;
  if (event.genres.length > 0) score += 10;
  if (event.organizer.website) score += 10;
  
  return score;
}
```

---

## 數據存儲

### 資料庫 Schema

```typescript
// drizzle/schema.ts
export const standardizedEvents = mysqlTable("standardized_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sourceId: varchar("sourceId", { length: 255 }).notNull(),
  source: mysqlEnum("source", [
    "kktix",
    "indievox",
    "accupass",
    "tixcraft",
    "ibon",
    "manual",
  ]).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  descriptionHtml: text("descriptionHtml"),
  summary: text("summary"),
  
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  publishedAt: timestamp("publishedAt").notNull(),
  
  // 場地信息 (JSON)
  venue: json("venue").$type<VenueInfo>().notNull(),
  
  // 票務信息 (JSON)
  ticketing: json("ticketing").$type<TicketingInfo>().notNull(),
  
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
  organizer: json("organizer").$type<OrganizerInfo>().notNull(),
  
  // 媒體資源 (JSON)
  images: json("images").$type<ImageInfo[]>().notNull(),
  videos: json("videos").$type<VideoInfo[]>(),
  
  // 陣容信息 (JSON)
  lineup: json("lineup").$type<LineupInfo[]>(),
  
  // 元數據 (JSON)
  metadata: json("metadata").$type<EventMetadata>().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// 索引
export const standardizedEventsIndex = index("idx_source_sourceId").on(
  standardizedEvents.source,
  standardizedEvents.sourceId
);

export const standardizedEventsDateIndex = index("idx_startDate").on(
  standardizedEvents.startDate
);

export const standardizedEventsCategoryIndex = index("idx_category").on(
  standardizedEvents.category
);
```

---

## 使用示例

### 存儲標準化活動

```typescript
import { db } from "./db";
import { standardizedEvents } from "../drizzle/schema";

async function saveStandardizedEvent(event: StandardizedEvent) {
  // 檢查是否已存在
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
    // 更新
    await db
      .update(standardizedEvents)
      .set({
        ...event,
        updatedAt: new Date(),
      })
      .where(eq(standardizedEvents.id, existing[0].id));
  } else {
    // 插入
    await db.insert(standardizedEvents).values(event);
  }
}
```

### 查詢活動

```typescript
// 獲取即將舉行的活動
async function getUpcomingEvents(limit: number = 20) {
  return db
    .select()
    .from(standardizedEvents)
    .where(gte(standardizedEvents.startDate, new Date()))
    .orderBy(asc(standardizedEvents.startDate))
    .limit(limit);
}

// 按分類查詢
async function getEventsByCategory(category: EventCategory) {
  return db
    .select()
    .from(standardizedEvents)
    .where(eq(standardizedEvents.category, category))
    .orderBy(asc(standardizedEvents.startDate));
}

// 附近的活動
async function getNearbyEvents(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  // 使用 Haversine 公式計算距離
  const events = await db.select().from(standardizedEvents);
  
  return events.filter((event) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      event.venue.location.latitude,
      event.venue.location.longitude
    );
    return distance <= radiusKm;
  });
}
```

---

## 總結

這個標準化數據結構:
- ✅ 支援多個售票平台
- ✅ 包含完整的活動信息
- ✅ 支援地理位置查詢
- ✅ 包含數據質量評分
- ✅ 保留原始數據用於調試
- ✅ 支援增量更新
