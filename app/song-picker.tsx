import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
}

const POPULAR_SONGS: Song[] = [
  { id: "1", name: "大風吹", artist: "草東沒有派對", album: "醜奴兒" },
  { id: "2", name: "浪子回頭", artist: "茄子蛋", album: "卡通人物" },
  { id: "3", name: "我無法停止愛你", artist: "落日飛車", album: "Jinji Kikko" },
  { id: "4", name: "電話", artist: "美秀集團", album: "電火王" },
  { id: "5", name: "愛人錯過", artist: "告五人", album: "運氣來得若有似無" },
  { id: "6", name: "魚仔", artist: "盧廣仲", album: "What a Folk!!!!!!" },
  { id: "7", name: "你啊你啊", artist: "魏如萱", album: "末路狂花" },
  { id: "8", name: "不要問我", artist: "血肉果汁機", album: "GIGO" },
  { id: "9", name: "慢慢喜歡你", artist: "莫文蔚", album: "我們在中場相遇" },
  { id: "10", name: "倔強", artist: "五月天", album: "神的孩子都在跳舞" },
  { id: "11", name: "山海", artist: "草東沒有派對", album: "醜奴兒" },
  { id: "12", name: "日常", artist: "盧廣仲", album: "幾分之幾" },
];

/**
 * 點歌破冰頁面
 * 選擇一首歌作為破冰訊息
 */
export default function SongPickerScreen() {
  const router = useRouter();
  const colors = useColors();
  const { targetName } = useLocalSearchParams<{ targetName: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const filteredSongs = searchQuery
    ? POPULAR_SONGS.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artist.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : POPULAR_SONGS;

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSendSong = () => {
    if (!selectedSong) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // In real app, this would send the song as an icebreaker
    router.back();
  };

  const renderSong = ({ item }: { item: Song }) => {
    const isSelected = selectedSong?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleSelectSong(item)}
        className={`mx-6 mb-3 rounded-xl p-4 border ${isSelected ? "bg-primary/10 border-primary" : "bg-surface border-border"}`}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center">
            <Text className="text-lg">🎵</Text>
          </View>
          <View className="flex-1">
            <Text className={`text-base font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
              {item.name}
            </Text>
            <Text className="text-sm text-muted">{item.artist} · {item.album}</Text>
          </View>
          {isSelected && (
            <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-foreground">←</Text>
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-xl font-bold text-foreground">點歌破冰</Text>
          {targetName && (
            <Text className="text-sm text-muted">選一首歌送給 {targetName}</Text>
          )}
        </View>
      </View>

      {/* Search */}
      <View className="px-6 pb-4">
        <View className="bg-surface rounded-xl border border-border px-4 py-3 flex-row items-center gap-2">
          <Text className="text-muted">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="搜尋歌曲或藝人"
            placeholderTextColor={colors.muted}
            className="flex-1 text-base text-foreground"
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text className="text-muted">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Section Header */}
      <View className="px-6 pb-3">
        <Text className="text-sm font-semibold text-muted">
          {searchQuery ? "搜尋結果" : "🔥 熱門歌曲"}
        </Text>
      </View>

      {/* Song List */}
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🎶</Text>
            <Text className="text-base text-muted">找不到相關歌曲</Text>
          </View>
        }
      />

      {/* Send Button */}
      {selectedSong && (
        <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border">
          <View className="flex-row items-center gap-3 mb-3">
            <Text className="text-lg">🎵</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">{selectedSong.name}</Text>
              <Text className="text-xs text-muted">{selectedSong.artist}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleSendSong}
            className="bg-primary py-4 rounded-full items-center"
          >
            <Text className="text-white font-bold text-base">
              🎵 送出這首歌
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}
