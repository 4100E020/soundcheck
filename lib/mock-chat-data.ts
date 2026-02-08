/**
 * 聊天相關模擬數據
 */

export interface MockChatRoom {
  id: number;
  type: "private" | "crew";
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
}

export interface MockMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  messageType: "text" | "image" | "song";
  metadata?: {
    songId?: string;
    songName?: string;
    artistName?: string;
    imageUrl?: string;
  };
  createdAt: Date;
  isMe: boolean;
}

// 模擬聊天室列表
export const mockChatRooms: MockChatRoom[] = [
  {
    id: 1,
    type: "private",
    name: "音樂狂熱者",
    avatar: "https://i.pravatar.cc/150?img=1",
    lastMessage: "明天一起去看草東!",
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5分鐘前
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 2,
    type: "private",
    name: "搖滾青年",
    avatar: "https://i.pravatar.cc/150?img=2",
    lastMessage: "你也喜歡血肉果汁機嗎?",
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30分鐘前
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: 3,
    type: "crew",
    name: "台北→高雄 3/28 早上出發",
    avatar: "https://i.pravatar.cc/150?img=5",
    lastMessage: "民謠愛好者: 我們幾點集合?",
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小時前
    unreadCount: 5,
  },
  {
    id: 4,
    type: "crew",
    name: "一起看草東!",
    avatar: "https://i.pravatar.cc/150?img=3",
    lastMessage: "電音派對: 我會帶相機!",
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1天前
    unreadCount: 0,
  },
];

// 模擬訊息列表 (chatRoomId: 1)
export const mockMessages: MockMessage[] = [
  {
    id: 1,
    chatRoomId: 1,
    senderId: 1,
    senderName: "音樂狂熱者",
    senderAvatar: "https://i.pravatar.cc/150?img=1",
    content: "嗨!看到你也要去大港開唱",
    messageType: "text",
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1小時前
    isMe: false,
  },
  {
    id: 2,
    chatRoomId: 1,
    senderId: 999, // 當前用戶
    senderName: "我",
    senderAvatar: "https://i.pravatar.cc/150?img=10",
    content: "對啊!超期待的",
    messageType: "text",
    createdAt: new Date(Date.now() - 55 * 60 * 1000),
    isMe: true,
  },
  {
    id: 3,
    chatRoomId: 1,
    senderId: 1,
    senderName: "音樂狂熱者",
    senderAvatar: "https://i.pravatar.cc/150?img=1",
    content: "我最想看草東和落日飛車",
    messageType: "text",
    createdAt: new Date(Date.now() - 50 * 60 * 1000),
    isMe: false,
  },
  {
    id: 4,
    chatRoomId: 1,
    senderId: 999,
    senderName: "我",
    senderAvatar: "https://i.pravatar.cc/150?img=10",
    content: "我也是!草東是我的本命",
    messageType: "text",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    isMe: true,
  },
  {
    id: 5,
    chatRoomId: 1,
    senderId: 1,
    senderName: "音樂狂熱者",
    senderAvatar: "https://i.pravatar.cc/150?img=1",
    content: "分享一首歌給你",
    messageType: "song",
    metadata: {
      songId: "spotify:track:123",
      songName: "大風吹",
      artistName: "草東沒有派對",
    },
    createdAt: new Date(Date.now() - 40 * 60 * 1000),
    isMe: false,
  },
  {
    id: 6,
    chatRoomId: 1,
    senderId: 999,
    senderName: "我",
    senderAvatar: "https://i.pravatar.cc/150?img=10",
    content: "這首超讚!",
    messageType: "text",
    createdAt: new Date(Date.now() - 35 * 60 * 1000),
    isMe: true,
  },
  {
    id: 7,
    chatRoomId: 1,
    senderId: 1,
    senderName: "音樂狂熱者",
    senderAvatar: "https://i.pravatar.cc/150?img=1",
    content: "明天一起去看草東!",
    messageType: "text",
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    isMe: false,
  },
];

// 格式化時間
export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "剛剛";
  if (minutes < 60) return `${minutes}分鐘前`;
  if (hours < 24) return `${hours}小時前`;
  if (days < 7) return `${days}天前`;

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}`;
}

// 格式化訊息時間 (詳細)
export function formatMessageTimeDetailed(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
