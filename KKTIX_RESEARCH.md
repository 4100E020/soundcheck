# KKTIX 爬蟲研究報告

## 研究發現

### 1. KKTIX API 結構

根據 GitHub 上的 kktix-api gem 專案,KKTIX 提供以下數據訪問方式:

#### 組織 Feed (Atom/RSS)
```
https://{organization_id}.kktix.cc/events.atom?locale=zh-TW
```

**示例**:
- https://hackingthursday.kktix.cc/events.atom?locale=zh-TW
- https://javascript-tw.kktix.cc/events.atom?locale=zh-TW

#### 可獲取的活動數據字段
根據 kktix-api gem 的文檔,每個活動包含:
- `url` - 活動頁面 URL
- `published` - 發布時間
- `title` - 活動標題
- `summary` - 活動摘要
- `content` - 活動詳細內容
- `author` - 活動作者/主辦方

### 2. KKTIX 網站結構

#### 探索頁面
- URL: https://kktix.com/events
- 問題: 有 CAPTCHA 保護,無法直接爬取

#### 組織頁面結構
```
https://{organization_id}.kktix.cc/
https://{organization_id}.kktix.cc/events
https://{organization_id}.kktix.cc/events/{event_id}
```

### 3. 數據獲取策略

#### 方案 A: 使用 Atom Feed (推薦)
**優點**:
- 官方提供的數據格式
- 結構化的 XML 數據
- 不需要處理 CAPTCHA
- 穩定可靠

**缺點**:
- 需要知道組織 ID
- 只能獲取單個組織的活動
- 可能無法獲取所有活動

**實作方式**:
```typescript
// 獲取組織的活動 Feed
const feedUrl = `https://${orgId}.kktix.cc/events.atom?locale=zh-TW`;
const response = await fetch(feedUrl);
const xmlText = await response.text();
// 解析 Atom XML
```

#### 方案 B: 爬取組織列表 + Feed
**優點**:
- 可以獲取多個組織的活動
- 覆蓋範圍更廣

**缺點**:
- 需要維護組織列表
- 需要定期更新組織列表

**實作方式**:
1. 維護一個音樂相關組織的列表
2. 定期從每個組織的 Feed 獲取活動
3. 合併並去重

#### 方案 C: 使用 KKTIX API (如果有)
**問題**: 
- KKTIX 似乎沒有公開的官方 API
- kktix-api gem 只是封裝了 Atom Feed 的訪問

### 4. 音樂相關組織列表 (初始)

需要收集台灣音樂活動常用的 KKTIX 組織 ID:
- `streetvoice` - StreetVoice
- `thewall` - The Wall
- `legacy` - Legacy
- `riverside` - Riverside
- `bluenote` - Blue Note Taipei
- 等等...

### 5. Atom Feed 數據結構示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>組織名稱 活動</title>
  <link href="https://org.kktix.cc/events" rel="alternate"/>
  <id>https://org.kktix.cc/events</id>
  <updated>2026-02-10T00:00:00Z</updated>
  
  <entry>
    <title>活動標題</title>
    <link href="https://org.kktix.cc/events/event-id" rel="alternate"/>
    <id>https://org.kktix.cc/events/event-id</id>
    <published>2026-02-01T00:00:00Z</published>
    <updated>2026-02-01T00:00:00Z</updated>
    <author>
      <name>主辦方</name>
    </author>
    <summary>活動摘要</summary>
    <content type="html">
      活動詳細內容 (HTML)
    </content>
  </entry>
</feed>
```

## 建議實作方案

### 階段 1: 基礎爬蟲
1. 建立音樂相關組織 ID 列表
2. 實作 Atom Feed 解析器
3. 定期獲取並存儲活動數據

### 階段 2: 數據增強
1. 爬取活動詳情頁面獲取更多信息:
   - 活動圖片
   - 票價
   - 場地地址
   - 座標
   - 開始/結束時間
2. 使用 LLM 提取和標準化數據

### 階段 3: 自動化
1. 設置定時任務 (每小時/每天)
2. 實作增量更新
3. 監控數據質量

## 技術棧建議

### Node.js 實作
```typescript
// 依賴
- axios: HTTP 請求
- xml2js: XML 解析
- cheerio: HTML 解析 (如需爬取詳情頁)
- node-cron: 定時任務
```

### Python 實作
```python
# 依賴
- requests: HTTP 請求
- feedparser: Feed 解析
- beautifulsoup4: HTML 解析
- schedule: 定時任務
```

## 法律與倫理考量

1. **遵守 robots.txt**: 檢查 KKTIX 的爬蟲政策
2. **請求頻率限制**: 避免過於頻繁的請求
3. **數據使用**: 僅用於應用程式內部,不公開分享
4. **歸屬標註**: 在應用程式中標註數據來源

## 下一步

1. 收集音樂相關組織 ID 列表
2. 實作 Atom Feed 爬蟲
3. 設計標準化數據結構
4. 測試爬蟲穩定性
