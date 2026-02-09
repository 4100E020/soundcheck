import { useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  mockChatRooms,
  mockMessages,
  formatMessageTimeDetailed,
  type MockMessage,
} from "@/lib/mock-chat-data";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

/**
 * 聊天對話頁面
 * 支援私訊與群組聊天
 */
export default function ChatConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatRoom = mockChatRooms.find((c) => c.id === Number(id));

  useEffect(() => {
    // Load messages for this chat room
    const roomMessages = mockMessages.filter((m) => m.chatRoomId === Number(id));
    if (roomMessages.length > 0) {
      setMessages(roomMessages);
    } else {
      // Generate some default messages for other chat rooms
      setMessages([
        {
          id: 100,
          chatRoomId: Number(id),
          senderId: Number(id),
          senderName: chatRoom?.name || "用戶",
          senderAvatar: chatRoom?.avatar || "",
          content: chatRoom?.lastMessage || "嗨！",
          messageType: "text",
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          isMe: false,
        },
      ]);
    }
  }, [id]);

  const handleSend = () => {
    if (!messageText.trim()) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: MockMessage = {
      id: Date.now(),
      chatRoomId: Number(id),
      senderId: 999,
      senderName: "我",
      senderAvatar: "https://i.pravatar.cc/150?img=10",
      content: messageText.trim(),
      messageType: "text",
      createdAt: new Date(),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");

    // Simulate auto-reply after 1.5s
    setTimeout(() => {
      const autoReply: MockMessage = {
        id: Date.now() + 1,
        chatRoomId: Number(id),
        senderId: Number(id),
        senderName: chatRoom?.name || "用戶",
        senderAvatar: chatRoom?.avatar || "",
        content: getAutoReply(),
        messageType: "text",
        createdAt: new Date(),
        isMe: false,
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1500);
  };

  const handleSendSong = (songName: string, artistName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newMessage: MockMessage = {
      id: Date.now(),
      chatRoomId: Number(id),
      senderId: 999,
      senderName: "我",
      senderAvatar: "https://i.pravatar.cc/150?img=10",
      content: `分享了一首歌`,
      messageType: "song",
      metadata: {
        songId: `song_${Date.now()}`,
        songName,
        artistName,
      },
      createdAt: new Date(),
      isMe: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setShowSongPicker(false);
  };

  const getAutoReply = () => {
    const replies = [
      "好啊！太期待了 🎶",
      "我也是這樣想的！",
      "到時候一起去吧！",
      "讚！那我們約個時間",
      "哈哈 好的好的",
      "太棒了！",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  };

  const renderMessage = ({ item }: { item: MockMessage }) => {
    const isMe = item.isMe;
    const isGroup = chatRoom?.type === "crew";

    return (
      <View className={`px-4 py-1 ${isMe ? "items-end" : "items-start"}`}>
        <View className={`flex-row ${isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2 max-w-[80%]`}>
          {/* Avatar (only show for others in group chat) */}
          {!isMe && isGroup && (
            <Image
              source={{ uri: item.senderAvatar }}
              className="w-8 h-8 rounded-full"
            />
          )}

          <View>
            {/* Sender name (only in group chat) */}
            {!isMe && isGroup && (
              <Text className="text-xs text-muted mb-1 ml-1">{item.senderName}</Text>
            )}

            {/* Message bubble */}
            {item.messageType === "song" && item.metadata ? (
              <View
                className={`rounded-2xl px-4 py-3 ${isMe ? "bg-primary" : "bg-surface border border-border"}`}
              >
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-lg">🎵</Text>
                  <Text className={`text-sm font-bold ${isMe ? "text-white" : "text-foreground"}`}>
                    {item.metadata.songName}
                  </Text>
                </View>
                <Text className={`text-xs ${isMe ? "text-white/70" : "text-muted"}`}>
                  {item.metadata.artistName}
                </Text>
              </View>
            ) : (
              <View
                className={`rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary" : "bg-surface border border-border"}`}
              >
                <Text className={`text-base ${isMe ? "text-white" : "text-foreground"}`}>
                  {item.content}
                </Text>
              </View>
            )}

            {/* Time */}
            <Text className={`text-xs text-muted mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
              {formatMessageTimeDetailed(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Song picker data
  const popularSongs = [
    { name: "大風吹", artist: "草東沒有派對" },
    { name: "浪子回頭", artist: "茄子蛋" },
    { name: "我無法停止愛你", artist: "落日飛車" },
    { name: "電話", artist: "美秀集團" },
    { name: "愛人錯過", artist: "告五人" },
    { name: "魚仔", artist: "盧廣仲" },
  ];

  if (!chatRoom) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-foreground">聊天室不存在</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-border bg-background">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: chatRoom.avatar }}
            className="w-10 h-10 rounded-full ml-3"
          />
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-foreground" numberOfLines={1}>
              {chatRoom.name}
            </Text>
            {chatRoom.type === "crew" ? (
              <Text className="text-xs text-muted">揪團群組</Text>
            ) : chatRoom.isOnline ? (
              <Text className="text-xs text-success">在線</Text>
            ) : (
              <Text className="text-xs text-muted">離線</Text>
            )}
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Song Picker */}
        {showSongPicker && (
          <View className="bg-surface border-t border-border px-4 py-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-foreground">🎵 選擇歌曲</Text>
              <TouchableOpacity onPress={() => setShowSongPicker(false)}>
                <Text className="text-sm text-muted">關閉</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popularSongs}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSendSong(item.name, item.artist)}
                  className="bg-background rounded-xl px-4 py-3 mr-3 border border-border"
                  style={{ minWidth: 140 }}
                >
                  <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted mt-1" numberOfLines={1}>
                    {item.artist}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View className="flex-row items-end px-4 py-3 border-t border-border bg-background gap-2">
          {/* Song Button */}
          <TouchableOpacity
            onPress={() => setShowSongPicker(!showSongPicker)}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
          >
            <Text className="text-lg">🎵</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <View className="flex-1 bg-surface rounded-2xl border border-border px-4 py-2.5 min-h-[40px] max-h-[120px]">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="輸入訊息..."
              placeholderTextColor={colors.muted}
              className="text-base text-foreground"
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            className={`w-10 h-10 rounded-full items-center justify-center ${messageText.trim() ? "bg-primary" : "bg-muted/30"}`}
            disabled={!messageText.trim()}
          >
            <Text className="text-white text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
