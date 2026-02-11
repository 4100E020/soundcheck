# KKTIX 爬蟲執行報告

## 執行摘要

**執行時間**: 2026-02-10 21:40-21:50  
**爬蟲狀態**: ⚠️ 部分成功 (需要修復)  
**存儲結果**: 0 個活動成功存儲  
**總爬取嘗試**: 11 個音樂組織

## 執行結果詳情

### 成功的組織 (3/11)
| 組織 | Feed URL | 狀態 | 活動數 |
|------|---------|------|-------|
| streetvoice | https://streetvoice.kktix.cc/events.atom | ✅ Feed 可訪問 | 0 (轉換失敗) |
| thewall | https://thewall.kktix.cc/events.atom | ✅ Feed 可訪問 | 0 (轉換失敗) |
| indievox | https://indievox.kktix.cc/events.atom | ✅ Feed 可訪問 | 0 (轉換失敗) |

### 失敗的組織 (8/11)
| 組織 | Feed URL | 錯誤 |
|------|---------|------|
| legacy | https://legacy.kktix.cc/events.atom | 404 Not Found |
| riverside | https://riverside.kktix.cc/events.atom | 404 Not Found |
| bluenote | https://bluenote.kktix.cc/events.atom | 404 Not Found |
| eslite | https://eslite.kktix.cc/events.atom | 空結果 |
| ticketplus | https://ticketplus.kktix.cc/events.atom | 404 Not Found |
| musicmatters | https://musicmatters.kktix.cc/events.atom | 404 Not Found |
| taipeiarena | https://taipeiarena.kktix.cc/events.atom | 404 Not Found |
| ticc | https://ticc.kktix.cc/events.atom | 空結果 |

## 問題分析

### P0 - 關鍵問題

**1. 地理位置數據缺失**
- **症狀**: `TypeError: Cannot read properties of undefined (reading 'latitude')`
- **原因**: LLM 提取的場地信息沒有包含經緯度數據
- **影響**: 所有活動轉換失敗
- **解決方案**: 
  - 修改 LLM 提示詞要求提供經緯度
  - 或使用地理編碼服務 (Geocoding API) 將場地名稱轉換為坐標
  - 或使場地位置為可選字段

**2. 許多 KKTIX 子域不存在**
- **症狀**: 404 Not Found 錯誤
- **原因**: 許多組織不使用 KKTIX 或已更改域名
- **影響**: 無法從這些組織爬取活動
- **解決方案**: 
  - 驗證組織的實際 KKTIX 域名
  - 改用 KKTIX 主站搜索 API (如果可用)
  - 手動維護活動組織列表

### P1 - 重要問題

**3. 無法提取結構化數據**
- **症狀**: LLM 返回的數據格式不符合預期
- **原因**: LLM 提示詞不夠精確
- **影響**: 活動轉換失敗
- **解決方案**: 改進 LLM 提示詞,提供更詳細的格式要求

## 建議的修復步驟

### 短期修復 (立即實施)

1. **修改 LLM 提示詞**
```typescript
// 在 transformKKTIXEvent 中修改提示
const prompt = `
提取以下活動信息,必須包含:
- 標題
- 描述
- 開始日期 (ISO 8601 格式)
- 場地名稱
- 場地地址
- 場地經度 (如果不知道,使用 null)
- 場地緯度 (如果不知道,使用 null)
- 票價範圍 (最低和最高)
- 陣容/藝人列表
- 流派/分類
- 圖片 URL

返回 JSON 格式。
`;
```

2. **添加地理編碼支援**
```typescript
// 如果沒有經緯度,使用地理編碼 API
async function geocodeVenue(venueName: string, address: string) {
  // 使用 Google Maps API 或其他地理編碼服務
  // 返回 { latitude, longitude }
}
```

3. **驗證組織列表**
```typescript
// 更新 MUSIC_ORGANIZATIONS 列表
const MUSIC_ORGANIZATIONS = [
  { name: "streetvoice", domain: "streetvoice" }, // ✅ 已驗證
  { name: "thewall", domain: "thewall" }, // ✅ 已驗證
  { name: "indievox", domain: "indievox" }, // ✅ 已驗證
  // 移除或更新失敗的組織
];
```

### 中期改進 (1-2 週)

1. **實作多源爬蟲**
   - 添加 iNDIEVOX 爬蟲
   - 添加 Accupass 爬蟲
   - 添加 KKTIX 主站搜索爬蟲

2. **實作數據驗證**
   - 檢查必填字段
   - 驗證日期格式
   - 驗證票價範圍

3. **實作重試機制**
   - 對失敗的活動重試
   - 指數退避策略
   - 失敗日誌記錄

### 長期優化 (1 個月)

1. **實作定時任務**
   - 每日自動爬蟲
   - 失敗通知
   - 數據去重

2. **實作用戶反饋機制**
   - 用戶報告錯誤活動
   - 用戶建議新活動
   - 社群驗證活動信息

3. **實作 AI 學習**
   - 記錄 LLM 提取的成功和失敗案例
   - 持續改進提示詞
   - 建立活動數據知識庫

## 資料庫狀態

```sql
-- 檢查存儲結果
SELECT COUNT(*) as total_events, 
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
       COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
FROM standardized_events;
-- 結果: 0 rows (沒有成功存儲任何活動)
```

## 後續行動

### 立即行動 (今天)
- [ ] 修改 LLM 提示詞要求提供經緯度
- [ ] 驗證 KKTIX 組織域名列表
- [ ] 重新執行爬蟲腳本

### 本週行動
- [ ] 添加地理編碼支援
- [ ] 實作多源爬蟲 (iNDIEVOX)
- [ ] 測試爬蟲系統

### 本月行動
- [ ] 實作定時任務
- [ ] 整合到應用程式前端
- [ ] 上線真實活動數據

## 技術文檔

- **爬蟲腳本**: `/home/ubuntu/soundcheck/server/scrapers/kktix-scraper.ts`
- **存儲函數**: `/home/ubuntu/soundcheck/server/scrapers/event-storage.ts`
- **執行腳本**: `/home/ubuntu/soundcheck/server/scrapers/run-initial-scrape.ts`
- **API 端點**: `/home/ubuntu/soundcheck/server/routers.ts` (events.listReal, events.getRealById)
- **資料庫表**: `standardized_events` (drizzle/schema.ts)

## 結論

爬蟲系統的基礎架構已完成,但需要修復地理位置數據提取和組織域名驗證的問題。建議優先實施短期修復步驟,然後逐步實施中期和長期改進。
