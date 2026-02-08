/**
 * 模擬數據
 * 用於開發階段測試介面和功能
 */

export interface MockEvent {
  id: number;
  name: string;
  description: string;
  coverImage: string;
  eventType: "festival" | "concert" | "livehouse" | "other";
  venue: string;
  address: string;
  region: "north" | "central" | "south" | "east";
  startDate: Date;
  endDate?: Date;
  lineup: string[];
  ticketUrl?: string;
  officialUrl?: string;
  participantCount: number;
  vvipCount: number;
}

export interface MockUser {
  id: number;
  nickname: string;
  avatar: string;
  age: number;
  gender: "male" | "female" | "other";
  bio: string;
  isVVIP: boolean;
  matchScore: number;
  topArtists: string[];
  status?: string;
}

export interface MockCrew {
  id: number;
  eventId: number;
  creatorId: number;
  type: "transport" | "accommodation" | "onsite" | "ticket";
  title: string;
  description: string;
  maxMembers: number;
  currentMembers: number;
  isFull: boolean;
  createdAt: Date;
  creator: {
    nickname: string;
    avatar: string;
  };
}

// 模擬活動數據
export const mockEvents: MockEvent[] = [
  {
    id: 1,
    name: "大港開唱 2026",
    description: "南台灣最大音樂祭,集結國內外知名樂團與獨立音樂人",
    coverImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    eventType: "festival",
    venue: "駁二藝術特區",
    address: "高雄市鹽埕區大勇路1號",
    region: "south",
    startDate: new Date("2026-03-28"),
    endDate: new Date("2026-03-29"),
    lineup: ["草東沒有派對", "茄子蛋", "落日飛車", "美秀集團", "告五人"],
    ticketUrl: "https://example.com/tickets",
    officialUrl: "https://example.com",
    participantCount: 3420,
    vvipCount: 856,
  },
  {
    id: 2,
    name: "簡單生活節 2026",
    description: "音樂、市集、講座,體驗簡單生活的美好",
    coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
    eventType: "festival",
    venue: "華山1914文創園區",
    address: "台北市中正區八德路一段1號",
    region: "north",
    startDate: new Date("2026-04-15"),
    endDate: new Date("2026-04-16"),
    lineup: ["盧廣仲", "魏如萱", "9m88", "血肉果汁機", "傻子與白痴"],
    ticketUrl: "https://example.com/tickets",
    participantCount: 2180,
    vvipCount: 432,
  },
  {
    id: 3,
    name: "五月天 人生無限公司 巡迴演唱會",
    description: "五月天2026全新巡迴演唱會",
    coverImage: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
    eventType: "concert",
    venue: "台北小巨蛋",
    address: "台北市松山區南京東路四段2號",
    region: "north",
    startDate: new Date("2026-05-20"),
    lineup: ["五月天"],
    ticketUrl: "https://example.com/tickets",
    participantCount: 1520,
    vvipCount: 380,
  },
  {
    id: 4,
    name: "Legacy 呈獻:老王樂隊專場",
    description: "老王樂隊全新專輯巡演台北場",
    coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
    eventType: "livehouse",
    venue: "Legacy Taipei",
    address: "台北市中正區八德路一段1號",
    region: "north",
    startDate: new Date("2026-03-15"),
    lineup: ["老王樂隊"],
    ticketUrl: "https://example.com/tickets",
    participantCount: 420,
    vvipCount: 105,
  },
];

// 模擬用戶數據
export const mockUsers: MockUser[] = [
  {
    id: 1,
    nickname: "音樂狂熱者",
    avatar: "https://i.pravatar.cc/150?img=1",
    age: 25,
    gender: "female",
    bio: "熱愛獨立音樂,每個月至少參加一場Live",
    isVVIP: true,
    matchScore: 92,
    topArtists: ["草東沒有派對", "落日飛車", "美秀集團"],
    status: "📍 找人喝酒",
  },
  {
    id: 2,
    nickname: "搖滾青年",
    avatar: "https://i.pravatar.cc/150?img=2",
    age: 28,
    gender: "male",
    bio: "搖滾樂是我的信仰",
    isVVIP: true,
    matchScore: 88,
    topArtists: ["茄子蛋", "血肉果汁機", "傻子與白痴"],
    status: "📷 互幫拍照",
  },
  {
    id: 3,
    nickname: "電音派對",
    avatar: "https://i.pravatar.cc/150?img=3",
    age: 23,
    gender: "female",
    bio: "喜歡電音和派對氛圍",
    isVVIP: false,
    matchScore: 85,
    topArtists: ["9m88", "落日飛車", "告五人"],
  },
  {
    id: 4,
    nickname: "民謠愛好者",
    avatar: "https://i.pravatar.cc/150?img=4",
    age: 30,
    gender: "male",
    bio: "喜歡安靜的民謠和木吉他",
    isVVIP: true,
    matchScore: 78,
    topArtists: ["盧廣仲", "魏如萱", "老王樂隊"],
  },
];

// 模擬揪團數據
export const mockCrews: MockCrew[] = [
  {
    id: 1,
    eventId: 1,
    creatorId: 1,
    type: "transport",
    title: "台北→高雄 3/28 早上出發",
    description: "禁菸車,內建兩隻貓。預計早上8點從台北出發,下午1點抵達高雄。",
    maxMembers: 4,
    currentMembers: 2,
    isFull: false,
    createdAt: new Date("2026-02-01"),
    creator: {
      nickname: "音樂狂熱者",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
  },
  {
    id: 2,
    eventId: 1,
    creatorId: 2,
    type: "accommodation",
    title: "高雄市區民宿分攤",
    description: "已訂好4人房,還缺2人分攤房費。位置在駁二附近,步行5分鐘到會場。",
    maxMembers: 4,
    currentMembers: 4,
    isFull: true,
    createdAt: new Date("2026-02-03"),
    creator: {
      nickname: "搖滾青年",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
  },
  {
    id: 3,
    eventId: 1,
    creatorId: 3,
    type: "onsite",
    title: "一起看草東!",
    description: "草東是我的本命,想找同好一起看演出,互相拍照留念。",
    maxMembers: 6,
    currentMembers: 3,
    isFull: false,
    createdAt: new Date("2026-02-05"),
    creator: {
      nickname: "電音派對",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
  },
  {
    id: 4,
    eventId: 2,
    creatorId: 4,
    type: "ticket",
    title: "徵求兩日票一張",
    description: "因朋友臨時有事,想徵求簡單生活節兩日票一張,原價購入。",
    maxMembers: 2,
    currentMembers: 1,
    isFull: false,
    createdAt: new Date("2026-02-08"),
    creator: {
      nickname: "民謠愛好者",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
  },
];

// 計算倒數天數
export function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// 格式化日期
export function formatEventDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}/${month}/${day}`;
}

// 獲取活動類型標籤
export function getEventTypeLabel(type: MockEvent["eventType"]): string {
  const labels = {
    festival: "音樂祭",
    concert: "演唱會",
    livehouse: "Live House",
    other: "其他",
  };
  return labels[type];
}

// 獲取揪團類型標籤和顏色
export function getCrewTypeInfo(type: MockCrew["type"]): { label: string; emoji: string; color: string } {
  const info = {
    transport: { label: "交通", emoji: "🔴", color: "#FF5252" },
    accommodation: { label: "住宿", emoji: "🔵", color: "#2196F3" },
    onsite: { label: "現場", emoji: "🟢", color: "#00D9A3" },
    ticket: { label: "票券", emoji: "🟡", color: "#FFC107" },
  };
  return info[type];
}
