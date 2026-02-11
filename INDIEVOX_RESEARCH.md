# iNDIEVOX 爬蟲研究報告

## 網站結構分析

### 主要頁面
- **首頁**: https://www.indievox.com/
- **活動列表**: https://www.indievox.com/events
- **活動詳情**: https://www.indievox.com/events/{event_id}
- **場地頁面**: https://www.indievox.com/venues
- **新聞頁面**: https://www.indievox.com/news

### 活動信息結構

從首頁分析,iNDIEVOX 展示的活動信息包括:

1. **基本信息**
   - 活動標題 (e.g., "2.13（五） DISORDER LIVE #5")
   - 活動日期 (e.g., "2026/02/13 (Fri.)")
   - 活動海報/圖片

2. **活動分類**
   - Recent (最近活動)
   - Hot-selling (熱賣活動)
   - Event Tours (巡迴活動)

3. **場地信息**
   - Legacy Taipei
   - Legacy Taichung
   - Legacy TERA
   - SUB
   - Legacy mini @ amba
   - 迴響音樂藝文展演空間

### 技術特性

**前端框架**: React (基於動態內容加載)
**數據加載**: 可能使用 API 或 GraphQL
**分頁**: 使用 "more" 按鈕進行無限滾動

## 爬蟲策略

### 方案 A: 直接 HTML 爬蟲 (推薦)

```typescript
// 1. 爬取活動列表頁面
// 2. 解析 HTML 提取活動卡片信息
// 3. 點擊 "more" 按鈕加載更多
// 4. 對每個活動爬取詳情頁面
```

### 方案 B: API 爬蟲 (如果有 API)

```typescript
// 1. 檢查 Network 標籤找到 API 端點
// 2. 分析 API 請求參數
// 3. 直接調用 API 獲取活動數據
```

### 方案 C: Puppeteer/Playwright (最可靠)

```typescript
// 1. 使用無頭瀏覽器加載頁面
// 2. 等待動態內容加載
// 3. 提取活動信息
// 4. 自動點擊 "more" 按鈕加載更多
```

## 建議爬蟲實現

基於時間和資源限制,建議使用 **方案 A + 方案 C 混合**:

1. **首先嘗試 HTML 爬蟲** - 快速獲取基本信息
2. **如果失敗,使用 Puppeteer** - 處理動態內容
3. **對每個活動爬取詳情頁面** - 獲取完整信息

## 數據提取點

### 活動列表頁面提取
- 活動標題
- 活動日期
- 活動海報 URL
- 活動詳情頁面 URL

### 活動詳情頁面提取
- 活動描述
- 場地名稱
- 票價信息
- 藝人/陣容
- 活動分類
- 活動圖片

## 實現計畫

1. **第一步**: 建立基礎爬蟲框架
2. **第二步**: 實現 HTML 解析邏輯
3. **第三步**: 添加詳情頁面爬取
4. **第四步**: 集成數據存儲
5. **第五步**: 測試並優化

## 注意事項

- iNDIEVOX 可能有反爬蟲機制,需要設置合理的請求延遲
- 需要設置 User-Agent 模擬瀏覽器
- 可能需要處理 JavaScript 渲染的內容
- 遵守 robots.txt 規則
