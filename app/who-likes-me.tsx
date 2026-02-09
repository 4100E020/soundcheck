import { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockUsers } from "@/lib/mock-data";
import * as Haptics from "expo-haptics";

interface LikeUser {
  id: number;
  nickname: string;
  avatar: string;
  age: number;
  matchScore: number;
  isVVIP: boolean;
  likedAt: Date;
}

// Mock users who liked me
const mockLikers: LikeUser[] = [
  {
    id: 10,
    nickname: "節奏旅人",
    avatar: "https://i.pravatar.cc/150?img=11",
    age: 24,
    matchScore: 95,
    isVVIP: true,
    likedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 11,
    nickname: "吉他女孩",
    avatar: "https://i.pravatar.cc/150?img=12",
    age: 22,
    matchScore: 89,
    isVVIP: false,
    likedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 12,
    nickname: "電子迷幻",
    avatar: "https://i.pravatar.cc/150?img=13",
    age: 27,
    matchScore: 82,
    isVVIP: true,
    likedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 13,
    nickname: "嘻哈老司機",
    avatar: "https://i.pravatar.cc/150?img=14",
    age: 26,
    matchScore: 76,
    isVVIP: false,
    likedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: 14,
    nickname: "爵士貓",
    avatar: "https://i.pravatar.cc/150?img=15",
    age: 29,
    matchScore: 71,
    isVVIP: true,
    likedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export default function WhoLikesMeScreen() {
  const router = useRouter();
  const [likers] = useState<LikeUser[]>(mockLikers);

  const handleLikeBack = (userId: number) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // In real app, this would trigger a match
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (minutes < 60) return `${minutes}分鐘前`;
    if (hours < 24) return `${hours}小時前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  const renderLiker = ({ item }: { item: LikeUser }) => (
    <View className="px-6 py-3">
      <View className="bg-surface rounded-2xl p-4 border border-border">
        <View className="flex-row items-center gap-4">
          {/* Avatar */}
          <Image
            source={{ uri: item.avatar }}
            className="w-16 h-16 rounded-full"
          />

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-base font-bold text-foreground">{item.nickname}</Text>
              {item.isVVIP && (
                <View className="bg-success/10 px-2 py-0.5 rounded">
                  <Text className="text-xs font-semibold text-success">VVIP</Text>
                </View>
              )}
              <Text className="text-sm text-muted">{item.age}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-primary">
                  {item.matchScore}% 匹配
                </Text>
              </View>
              <Text className="text-xs text-muted">{formatTime(item.likedAt)}</Text>
            </View>
          </View>

          {/* Like Back Button */}
          <TouchableOpacity
            onPress={() => handleLikeBack(item.id)}
            className="bg-primary px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold text-sm">喜歡</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-foreground">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-4">誰喜歡我</Text>
        <View className="bg-primary rounded-full px-2 py-0.5 ml-2">
          <Text className="text-xs font-bold text-white">{likers.length}</Text>
        </View>
      </View>

      {/* VVIP Banner */}
      <View className="px-6 pb-4">
        <View className="bg-success/10 rounded-xl px-4 py-3 border border-success/30">
          <Text className="text-sm text-success font-semibold">
            VVIP 專屬功能 — 查看誰對你按了喜歡
          </Text>
        </View>
      </View>

      {/* Likers List */}
      <FlatList
        data={likers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLiker}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">💝</Text>
            <Text className="text-lg font-bold text-foreground mb-2">還沒有人喜歡你</Text>
            <Text className="text-sm text-muted text-center">
              多參加活動、完善個人資料，增加被喜歡的機會
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
