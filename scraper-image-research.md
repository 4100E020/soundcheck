# 爬蟲圖片擷取優化研究

## KKTIX 圖片結構分析

測試頁面：https://thewall.kktix.cc/events/onfireday

### 發現的圖片來源：

1. **Open Graph Meta Tag** (最可靠)
   - `<meta property="og:image" content="https://assets.kktix.io/upload_images/36437/512_512_original.jpg">`
   - 這是最標準的封面圖片來源

2. **Twitter Card Meta Tag** (備用)
   - `<meta name="twitter:image" content="https://assets.kktix.io/upload_images/36437/512_512_original.jpg">`

3. **頁面中的大圖**
   - `<img src="https://assets.kktix.io/upload_images/36437/512_512_large.jpg">`
   - 通常是活動的主視覺圖片

### 優化策略：

1. 優先從 Atom Feed 的 HTML 內容中提取 `og:image` meta tag
2. 如果沒有 og:image，則從 HTML 中找最大的圖片（通常是封面）
3. 過濾掉小圖標、追蹤像素、logo 等

### 實作方法：

```typescript
// 1. 先嘗試提取 og:image
const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
if (ogImageMatch) {
  return ogImageMatch[1];
}

// 2. 找所有 img 標籤，選擇最大的
const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
// 過濾並選擇最可能是封面的圖片
```

## iNDIEVOX 圖片結構

需要測試實際頁面結構

## Accupass 圖片結構

需要測試實際頁面結構
