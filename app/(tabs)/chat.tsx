import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type ChatFilter = "all" | "private" | "crew";

type ChatRoom = {
  id: number;
  type: "private" | "crew";
  crewId: number | null;
  lastMessageAt: Date | null;
  unreadCount: number;
};

/**
 * 聊天頁面
 * 顯示私訊對話與揪團群組
 */
export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useColors();
  const [filter, setFilter] = useState<ChatFilter>("all");

  // Fetch chat rooms
  const { data: chatRooms = [], isLoading } = trpc.chat.myRooms.useQuery(undefined, {
    enabled: !!user,
  });

  const filteredChats = chatRooms.filter((chat) => {
    if (filter === "all") return true;
    return chat.type === filter;
  });

  const totalUnread = chatRooms.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleFilter = (f: ChatFilter) => {
    setFilter(f);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatMessageTime = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "剛剛";
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    if (days < 7) return `${days}天前`;
    return new Date(date).toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric",
    });
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      className="flex-row items-center px-6 py-4 border-b border-border active:bg-surface"
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        router.push(`/chat/${item.id}`);
      }}
    >
      {/* Avatar */}
      <View className="relative">
        <Image
          source={{
            uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}`,
          }}
          className="w-14 h-14 rounded-full"
        />
      </View>

      {/* Chat Info */}
      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {item.type === "crew" ? `揪團 #${item.crewId}` : "私訊"}
            </Text>
            {item.type === "crew" && (
              <View className="bg-primary/10 px-2 py-0.5 rounded">
                <Text className="text-xs font-semibold text-primary">群組</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted ml-2">
            {formatMessageTime(item.lastMessageAt)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted flex-1" numberOfLines={1}>
            點擊查看訊息
          </Text>
          {item.unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-2">
              <Text className="text-xs font-bold text-white">
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show login prompt if not logged in
  if (!user) {
    return (
      <ScreenContainer className="px-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-xl font-semibold text-foreground text-center">
            登入後查看聊天
          </Text>
          <Text className="text-sm text-muted text-center">
            登入後即可與配對的夥伴聊天
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login" as any)}
            className="bg-primary px-8 py-3 rounded-full mt-4"
          >
            <Text className="text-background font-semibold">立即登入</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <ScreenContainer className="px-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted mt-4">載入中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-foreground">聊天</Text>
            {totalUnread > 0 && (
              <View className="bg-primary rounded-full px-3 py-1">
                <Text className="text-xs font-bold text-white">{totalUnread} 則未讀</Text>
              </View>
            )}
          </View>
          <Text className="text-base text-muted mt-1">
            與配對的夥伴聊天
          </Text>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-6 pb-4 gap-2">
          <TouchableOpacity
            onPress={() => handleFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "all" ? "text-background" : "text-foreground"
              }`}
            >
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilter("private")}
            className={`px-4 py-2 rounded-full ${
              filter === "private" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "private" ? "text-background" : "text-foreground"
              }`}
            >
              私訊
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilter("crew")}
            className={`px-4 py-2 rounded-full ${
              filter === "crew" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "crew" ? "text-background" : "text-foreground"
              }`}
            >
              揪團
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        {filteredChats.length > 0 ? (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-lg font-semibold text-foreground mb-2">
              尚無聊天記錄
            </Text>
            <Text className="text-sm text-muted text-center">
              {filter === "all"
                ? "開始配對或加入揪團，與夥伴聊天吧！"
                : filter === "private"
                  ? "配對成功後，即可開始私訊聊天"
                  : "加入揪團後，即可在群組中聊天"}
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
