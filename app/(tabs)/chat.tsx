import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockChatRooms, formatMessageTime } from "@/lib/mock-chat-data";
import { useRouter } from "expo-router";

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

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">聊天</Text>
          <Text className="text-base text-muted mt-1">
            與配對對象聊天，加入揪團群組
          </Text>
        </View>

        {/* 篩選分類 */}
        <View className="flex-row px-6 pb-4 gap-2">
          <TouchableOpacity
            onPress={() => setFilter("all")}
            className={`px-4 py-2 rounded-full ${
              filter === "all" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "all" ? "text-white" : "text-foreground"
              }`}
            >
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("private")}
            className={`px-4 py-2 rounded-full ${
              filter === "private" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "private" ? "text-white" : "text-foreground"
              }`}
            >
              私訊
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("crew")}
            className={`px-4 py-2 rounded-full ${
              filter === "crew" ? "bg-primary" : "bg-surface border border-border"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === "crew" ? "text-white" : "text-foreground"
              }`}
            >
              揪團群組
            </Text>
          </TouchableOpacity>
        </View>

        {/* 聊天列表 */}
        <ScrollView className="flex-1">
          {filteredChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              className="flex-row items-center px-6 py-4 border-b border-border active:bg-surface"
              onPress={() => {
                // TODO: Navigate to chat room
                console.log("Open chat", chat.id);
              }}
            >
              {/* 頭像 */}
              <View className="relative">
                <Image
                  source={{ uri: chat.avatar }}
                  className="w-14 h-14 rounded-full"
                />
                {chat.isOnline && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-background" />
                )}
              </View>

              {/* 聊天資訊 */}
              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                      {chat.name}
                    </Text>
                    {chat.type === "crew" && (
                      <View className="bg-secondary/10 px-2 py-0.5 rounded">
                        <Text className="text-xs font-semibold text-secondary">
                          群組
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-muted ml-2">
                    {formatMessageTime(chat.lastMessageTime)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted flex-1" numberOfLines={1}>
                    {chat.lastMessage}
                  </Text>
                  {chat.unreadCount > 0 && (
                    <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 ml-2">
                      <Text className="text-xs font-bold text-white">
                        {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {filteredChats.length === 0 && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-6xl mb-4">💬</Text>
              <Text className="text-lg font-bold text-foreground mb-2">
                還沒有聊天
              </Text>
              <Text className="text-sm text-muted text-center">
                在探索頁面配對成功後，就可以開始聊天了
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
