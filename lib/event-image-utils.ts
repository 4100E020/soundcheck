/**
 * 活動圖片工具
 * 提供預設封面圖和圖片處理邏輯
 */

/**
 * 根據活動類別和來源取得預設封面圖
 * 使用 Unsplash 高品質免費圖片
 */
const CATEGORY_IMAGES: Record<string, string[]> = {
  concert: [
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  ],
  festival: [
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
  ],
  live_music: [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80",
  ],
  club_event: [
    "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80",
  ],
  dj_set: [
    "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800&q=80",
    "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=80",
  ],
  party: [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  ],
  workshop: [
    "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
  ],
  conference: [
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80",
  ],
  other: [
    "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
  ],
};

/**
 * 根據活動 ID 和類別取得一致的封面圖
 * 使用 ID 的 hash 來確保同一活動總是顯示同一張圖
 */
export function getEventCoverImage(
  eventId: string,
  category: string,
  images?: Array<{ url: string; type: string }> | null,
): string {
  // 優先使用活動自帶的圖片
  if (images && images.length > 0) {
    const coverImage = images.find((img) => img.type === "cover") || images[0];
    if (coverImage?.url) {
      return coverImage.url;
    }
  }

  // 根據類別選擇預設圖片
  const categoryImages = CATEGORY_IMAGES[category] || CATEGORY_IMAGES.other;

  // 使用 ID 的簡單 hash 來選擇圖片（確保一致性）
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % categoryImages.length;

  return categoryImages[index];
}

/**
 * 根據活動類別取得漸層色（用於沒有圖片時的背景）
 */
export function getCategoryGradient(category: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    concert: ["#FF6B35", "#FF3D00"],
    festival: ["#6C63FF", "#3F51B5"],
    live_music: ["#00D9A3", "#00897B"],
    club_event: ["#E040FB", "#7C4DFF"],
    dj_set: ["#E040FB", "#7C4DFF"],
    party: ["#FF5252", "#FF1744"],
    workshop: ["#FFC107", "#FF9800"],
    conference: ["#2196F3", "#1565C0"],
    other: ["#607D8B", "#455A64"],
  };
  return gradients[category] || gradients.other;
}

/**
 * 取得活動類別的 emoji
 */
export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    concert: "🎤",
    festival: "🎪",
    live_music: "🎸",
    club_event: "🪩",
    dj_set: "🎧",
    party: "🎉",
    workshop: "🎹",
    conference: "🎼",
    other: "🎵",
  };
  return emojis[category] || "🎵";
}

/**
 * 取得活動類別的中文標籤
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    concert: "演唱會",
    festival: "音樂祭",
    club_event: "夜店活動",
    live_music: "現場演出",
    dj_set: "DJ Set",
    workshop: "工作坊",
    conference: "研討會",
    party: "派對",
    other: "音樂活動",
  };
  return labels[category] || "音樂活動";
}
