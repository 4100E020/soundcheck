import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

type Message = {
  id: number;
  chatRoomId: number;
  senderId: number;
  content: string;
  messageType: "text" | "image" | "song";
  metadata: any;
  createdAt: Date;
};

/**
 * 聊天對話頁面
 * 支援私訊與群組聊天
 */
export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const chatRoomId = Number(id);

  // Fetch messages
  const { data: messages = [], isLoading, refetch } = trpc.chat.getMessages.useQuery(
    { chatRoomId },
    { enabled: !!user && !!chatRoomId }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetch();
      setMessageText("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Mark as read mutation
  const markReadMutation = trpc.chat.markRead.useMutation();

  useEffect(() => {
    if (user && chatRoomId) {
      markReadMutation.mutate({ chatRoomId });
    }
  }, [chatRoomId, user]);

  const handleSend = () => {
    if (!messageText.trim() || !user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    sendMessageMutation.mutate({
      chatRoomId,
      content: messageText.trim(),
      messageType: "text",
    });
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const isToday = now.toDateString() === messageDate.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return messageDate.toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View className={`px-6 py-2 ${isMe ? "items-end" : "items-start"}`}>
        <View className={`flex-row gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
          {/* Avatar */}
          {!isMe && (
            <Image
              source={{
                uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${item.senderId}`,
              }}
              className="w-8 h-8 rounded-full"
            />
          )}

          {/* Message Bubble */}
          <View>
            <View
              className={`px-4 py-3 rounded-2xl ${
                isMe ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              {item.messageType === "text" && (
                <Text
                  className={`text-sm ${isMe ? "text-background" : "text-foreground"}`}
                >
                  {item.content}
                </Text>
              )}
              {item.messageType === "song" && item.metadata && (
                <View className="gap-1">
                  <Text
                    className={`text-xs ${isMe ? "text-background/70" : "text-muted"}`}
                  >
                    🎵 分享歌曲
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${
                      isMe ? "text-background" : "text-foreground"
                    }`}
                  >
                    {item.metadata.songName}
                  </Text>
                  <Text
                    className={`text-xs ${isMe ? "text-background/70" : "text-muted"}`}
                  >
                    {item.metadata.artistName}
                  </Text>
                </View>
              )}
            </View>
            <Text className={`text-xs text-muted mt-1 ${isMe ? "text-right" : ""}`}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Show login prompt if not logged in
  if (!user) {
    return (
      <ScreenContainer className="px-6">
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-xl font-semibold text-foreground text-center">
            請先登入
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login" as any)}
            className="bg-primary px-8 py-3 rounded-full"
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
    <ScreenContainer edges={["left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="px-6 py-4 border-b border-border flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">聊天室 #{chatRoomId}</Text>
            </View>
          </View>

          {/* Messages List */}
          {messages.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={[...messages].reverse()}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingVertical: 12 }}
              inverted
            />
          ) : (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-sm text-muted text-center">
                尚無訊息，開始聊天吧！
              </Text>
            </View>
          )}

          {/* Input Bar */}
          <View className="px-6 py-4 border-t border-border flex-row items-center gap-3">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="輸入訊息..."
              placeholderTextColor={colors.muted}
              className="flex-1 bg-surface rounded-full px-4 py-3 text-foreground"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                messageText.trim() ? "bg-primary" : "bg-surface"
              }`}
            >
              {sendMessageMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <IconSymbol
                  name="paperplane.fill"
                  size={20}
                  color={messageText.trim() ? colors.background : colors.muted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
