/**
 * 台灣音樂場地座標資料庫
 * 預定義的主要音樂場地經緯度,用於爬蟲地理編碼
 */

export interface VenueCoordinates {
  latitude: number;
  longitude: number;
  city: string;
  district?: string;
}

// 台灣主要音樂場地座標
export const VENUE_DATABASE: Record<string, VenueCoordinates> = {
  // 台北場地
  "Legacy Taipei": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "信義區" },
  "Legacy TERA": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "信義區" },
  "Legacy mini @ amba": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "信義區" },
  "Blue Note Taipei": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "信義區" },
  "Riverside Music Live House": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "大安區" },
  "The Wall": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "大安區" },
  "SUB": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "大安區" },
  "迴響音樂藝文展演空間": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "大安區" },
  "Taipei Arena": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "南港區" },
  "國父紀念館": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "信義區" },
  "台北小巨蛋": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "南港區" },
  "台北國際會議中心": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "南港區" },
  "誠品音樂廳": { latitude: 25.0443, longitude: 121.5597, city: "台北", district: "信義區" },
  "三創生活園區": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "中正區" },
  "華山1914文創園區": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "中正區" },
  "TICC": { latitude: 25.0330, longitude: 121.5654, city: "台北", district: "南港區" },

  // 台中場地
  "Legacy Taichung": { latitude: 24.1477, longitude: 120.6736, city: "台中", district: "西屯區" },
  "台中歌劇院": { latitude: 24.1477, longitude: 120.6736, city: "台中", district: "西屯區" },
  "台中爵士音樂節": { latitude: 24.1477, longitude: 120.6736, city: "台中", district: "西屯區" },

  // 高雄場地
  "高雄巨蛋": { latitude: 22.7149, longitude: 120.3051, city: "高雄", district: "左營區" },
  "高雄文化中心": { latitude: 22.6149, longitude: 120.3051, city: "高雄", district: "苓雅區" },

  // 台南場地
  "台南文化中心": { latitude: 22.9903, longitude: 120.2111, city: "台南", district: "東區" },

  // 新竹場地
  "新竹竹北演藝廳": { latitude: 24.8375, longitude: 120.9939, city: "新竹", district: "竹北市" },

  // 基隆場地
  "基隆文化中心": { latitude: 25.1276, longitude: 121.7405, city: "基隆", district: "中山區" },

  // 花蓮場地
  "花蓮文化中心": { latitude: 23.9868, longitude: 121.6024, city: "花蓮", district: "花蓮市" },

  // 澎湖場地
  "澎湖文化中心": { latitude: 23.5691, longitude: 119.5933, city: "澎湖", district: "馬公市" },
};

/**
 * 根據場地名稱查詢座標
 * 支援模糊匹配和別名
 */
export function getVenueCoordinates(venueName: string): VenueCoordinates | null {
  if (!venueName) return null;

  // 精確匹配
  if (VENUE_DATABASE[venueName]) {
    return VENUE_DATABASE[venueName];
  }

  // 模糊匹配 (包含關鍵詞)
  const normalizedName = venueName.toLowerCase();
  for (const [dbVenue, coords] of Object.entries(VENUE_DATABASE)) {
    if (dbVenue.toLowerCase().includes(normalizedName) || normalizedName.includes(dbVenue.toLowerCase())) {
      return coords;
    }
  }

  // 常見別名匹配
  const aliases: Record<string, string> = {
    "legacy": "Legacy Taipei",
    "小巨蛋": "台北小巨蛋",
    "國父紀念館": "國父紀念館",
    "華山": "華山1914文創園區",
    "誠品": "誠品音樂廳",
    "三創": "三創生活園區",
    "歌劇院": "台中歌劇院",
    "高雄巨蛋": "高雄巨蛋",
  };

  for (const [alias, venue] of Object.entries(aliases)) {
    if (venueName.includes(alias)) {
      return VENUE_DATABASE[venue] || null;
    }
  }

  return null;
}

/**
 * 批量查詢場地座標
 */
export function getVenuesCoordinates(venueNames: string[]): Map<string, VenueCoordinates> {
  const results = new Map<string, VenueCoordinates>();

  for (const venueName of venueNames) {
    const coords = getVenueCoordinates(venueName);
    if (coords) {
      results.set(venueName, coords);
    }
  }

  return results;
}

/**
 * 獲取資料庫統計
 */
export function getVenueDatabaseStats(): {
  totalVenues: number;
  cityCounts: Record<string, number>;
} {
  const cityCounts: Record<string, number> = {};

  for (const coords of Object.values(VENUE_DATABASE)) {
    cityCounts[coords.city] = (cityCounts[coords.city] || 0) + 1;
  }

  return {
    totalVenues: Object.keys(VENUE_DATABASE).length,
    cityCounts,
  };
}
