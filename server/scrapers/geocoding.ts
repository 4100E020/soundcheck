import axios from "axios";

interface GeocodingResult {
  latitude: number;
  longitude: number;
  city: string;
  address: string;
}

// 使用 Nominatim (OpenStreetMap) 免費地理編碼服務
// 文檔: https://nominatim.org/
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// 快取已編碼的位置,避免重複請求
const geocodingCache = new Map<string, GeocodingResult>();

/**
 * 使用 Nominatim 地理編碼服務將地址轉換為經緯度
 * 免費服務,無需 API 密鑰
 */
export async function geocodeAddress(
  venueName: string,
  address?: string,
  city: string = "台灣"
): Promise<GeocodingResult | null> {
  try {
    // 檢查快取
    const cacheKey = `${venueName}|${address}|${city}`;
    if (geocodingCache.has(cacheKey)) {
      console.log(`Using cached geocoding for: ${venueName}`);
      return geocodingCache.get(cacheKey)!;
    }

    // 組合搜尋查詢
    const query = address ? `${venueName}, ${address}, ${city}` : `${venueName}, ${city}`;

    console.log(`Geocoding: ${query}`);

    // 調用 Nominatim API
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: query,
        format: "json",
        limit: 1,
        countrycodes: "tw", // 限制台灣地區
      },
      headers: {
        "User-Agent": "SoundCheck-Scraper/1.0",
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      console.warn(`No geocoding result for: ${query}`);
      return null;
    }

    const result = response.data[0];
    const geocodingResult: GeocodingResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: city,
      address: result.display_name || address || venueName,
    };

    // 存入快取
    geocodingCache.set(cacheKey, geocodingResult);

    console.log(`Successfully geocoded: ${venueName} (${geocodingResult.latitude}, ${geocodingResult.longitude})`);
    return geocodingResult;
  } catch (error) {
    console.error(`Geocoding error for ${venueName}:`, error);
    return null;
  }
}

/**
 * 批量地理編碼多個地址
 */
export async function geocodeAddresses(
  venues: Array<{ name: string; address?: string; city?: string }>
): Promise<Map<string, GeocodingResult>> {
  const results = new Map<string, GeocodingResult>();

  for (const venue of venues) {
    const result = await geocodeAddress(venue.name, venue.address, venue.city);
    if (result) {
      results.set(venue.name, result);
    }
    // 添加延遲以避免超過 API 速率限制 (Nominatim 建議 1 秒延遲)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * 清空地理編碼快取
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
  console.log("Geocoding cache cleared");
}

/**
 * 獲取快取統計
 */
export function getGeocodingCacheStats(): { size: number; keys: string[] } {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys()),
  };
}
