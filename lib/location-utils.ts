/**
 * 位置工具函數
 * 用於計算距離、查找附近活動等
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * 使用 Haversine 公式計算兩點之間的距離 (公里)
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates
): number {
  const R = 6371; // 地球半徑 (公里)
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 格式化距離顯示
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} 公尺`;
  }
  if (km < 100) {
    return `${km.toFixed(1)} 公里`;
  }
  return `${Math.round(km)} 公里`;
}

/**
 * 根據用戶位置查找附近活動
 */
export function findNearbyEvents<T extends { latitude?: number; longitude?: number }>(
  userLocation: Coordinates | null,
  events: T[],
  radiusKm: number = 50
): (T & { distance?: number })[] {
  if (!userLocation) {
    return events;
  }

  return events
    .map((event) => {
      if (!event.latitude || !event.longitude) {
        return { ...event, distance: undefined };
      }
      const distance = calculateDistance(userLocation, {
        latitude: event.latitude,
        longitude: event.longitude,
      });
      return { ...event, distance };
    })
    .filter((event) => !event.distance || event.distance <= radiusKm)
    .sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return a.distance - b.distance;
    });
}

/**
 * 獲取方向 (北、東、南、西等)
 */
export function getDirection(from: Coordinates, to: Coordinates): string {
  const dLat = to.latitude - from.latitude;
  const dLon = to.longitude - from.longitude;
  const angle = Math.atan2(dLon, dLat) * (180 / Math.PI);

  if (angle >= -22.5 && angle < 22.5) return "北";
  if (angle >= 22.5 && angle < 67.5) return "東北";
  if (angle >= 67.5 && angle < 112.5) return "東";
  if (angle >= 112.5 && angle < 157.5) return "東南";
  if (angle >= 157.5 || angle < -157.5) return "南";
  if (angle >= -157.5 && angle < -112.5) return "西南";
  if (angle >= -112.5 && angle < -67.5) return "西";
  return "西北";
}

/**
 * 檢查兩個位置是否在同一城市 (簡化版)
 */
export function isSameCity(
  coords1: Coordinates,
  coords2: Coordinates,
  thresholdKm: number = 50
): boolean {
  return calculateDistance(coords1, coords2) <= thresholdKm;
}

/**
 * 生成地圖 URL (Google Maps)
 */
export function getGoogleMapsUrl(coords: Coordinates): string {
  return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

/**
 * 生成地圖 URL (Apple Maps)
 */
export function getAppleMapsUrl(coords: Coordinates): string {
  return `maps://maps.apple.com/?q=${coords.latitude},${coords.longitude}`;
}

/**
 * 排序活動 - 按距離
 */
export function sortByDistance<T extends { distance?: number }>(
  events: T[]
): T[] {
  return [...events].sort((a, b) => {
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });
}

/**
 * 排序活動 - 按人氣
 */
export function sortByPopularity<T extends { participantCount?: number }>(
  events: T[]
): T[] {
  return [...events].sort((a, b) => {
    const countA = a.participantCount || 0;
    const countB = b.participantCount || 0;
    return countB - countA;
  });
}
