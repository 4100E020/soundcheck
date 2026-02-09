import { useState } from "react";
import { Text, View, TouchableOpacity, Image, FlatList, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockChatRooms, formatMessageTime, type MockChatRoom } from "@/lib/mock-chat-data";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

type ChatFilter = "all" | "private" | "crew";

/**
 * 聊天頁面
 * 顯示私訊對話與揪團群組
 */
export default function ChatScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<ChatFilter>("all");

  const filteredChats = mockChatRooms.filter((chat) => {
    if (filter === "all") return true;
    return chat.type === filter;
  });

  const totalUnread = mockChatRooms.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleFilter = (f: ChatFilter) => {
    setFilter(f);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderChatItem = ({ item }: { item: MockChatRoom }) => (
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
          source={{ uri: item.avatar }}
          className="w-14 h-14 rounded-full"
        />
        {item.isOnline && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-background" />
        )}
      </View>

      {/* Chat Info */}
      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2 flex-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
            {item.type === "crew" && (
              <View className="bg-secondary/10 px-2 py-0.5 rounded">
                <Text className="text-xs font-semibold text-secondary">群組</Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-muted ml-2">
            {formatMessageTime(item.lastMessageTime)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted flex-1" numberOfLines={1}>
            {item.lastMessage}
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
            與配對對象聊天，加入揪團群組
          </Text>
        </View>

        {/* Filter */}
        <View className="flex-row px-6 pb-4 gap-2">
          {([
            { key: "all" as ChatFilter, label: "全部" },
            { key: "private" as ChatFilter, label: "私訊" },
            { key: "crew" as ChatFilter, label: "揪團群組" },
          ]).map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => handleFilter(f.key)}
              className={`px-4 py-2 rounded-full ${
                filter === f.key ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  filter === f.key ? "text-white" : "text-foreground"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chat List */}
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">💬</Text>
              <Text className="text-lg font-bold text-foreground mb-2">
                還沒有聊天
              </Text>
              <Text className="text-sm text-muted text-center">
                在探索頁面配對成功後，就可以開始聊天了
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
