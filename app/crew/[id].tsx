import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockCrews, getCrewTypeInfo } from "@/lib/mock-data";
import { trpc } from "@/lib/trpc";
import { getEventCoverImage } from "@/lib/event-image-utils";
import * as Haptics from "expo-haptics";

/**
 * 揪團詳情頁面
 * 顯示揪團資訊、成員列表、申請加入
 * 揪團資料暫用 mock，活動資訊使用真實 API
 */
export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [hasApplied, setHasApplied] = useState(false);

  const crew = mockCrews.find((c) => c.id === Number(id));

  // Fetch real events to find the associated event
  const { data: realEvents } = trpc.events.listReal.useQuery({
    limit: 50,
    offset: 0,
  });

  // Try to find a matching real event (use first event as fallback for demo)
  const realEvent = realEvents?.[0];
  const eventName = realEvent?.title || "音樂活動";
  const eventVenue = realEvent?.venue?.name || "活動場地";
  const eventCover = realEvent
    ? getEventCoverImage(realEvent.id, realEvent.category, realEvent.images)
    : "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80";
  const eventId = realEvent?.id || "";

  if (!crew) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-5xl mb-4">🎪</Text>
        <Text className="text-xl font-bold text-foreground mb-2">揪團不存在</Text>
        <Text className="text-muted mb-6 text-center">
          找不到此揪團，可能已被移除或連結無效
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">返回</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const typeInfo = getCrewTypeInfo(crew.type);

  // Mock members
  const mockMembers = [
    { id: crew.creatorId, nickname: crew.creator.nickname, avatar: crew.creator.avatar, isCreator: true },
    ...(crew.currentMembers > 1
      ? Array.from({ length: crew.currentMembers - 1 }, (_, i) => ({
          id: 100 + i,
          nickname: `成員 ${i + 1}`,
          avatar: `https://i.pravatar.cc/150?img=${10 + i}`,
          isCreator: false,
        }))
      : []),
  ];

  const handleApply = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setHasApplied(true);
    if (Platform.OS === "web") {
      alert("已送出申請！等待團主確認");
    } else {
      Alert.alert("已送出", "已送出申請！等待團主確認");
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">揪團詳情</Text>
        </View>

        {/* Crew Info Card */}
        <View className="px-6 pb-6">
          <View className="bg-surface rounded-2xl p-5 border border-border gap-4">
            {/* Type & Status */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{typeInfo.emoji}</Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: typeInfo.color + "20" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: typeInfo.color }}>
                    {typeInfo.label}
                  </Text>
                </View>
              </View>
              {crew.isFull ? (
                <View className="bg-muted/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-muted">已滿團</Text>
                </View>
              ) : (
                <View className="bg-success/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-success">
                    缺 {crew.maxMembers - crew.currentMembers} 人
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-foreground">{crew.title}</Text>

            {/* Description */}
            <Text className="text-sm text-muted leading-relaxed">{crew.description}</Text>

            {/* Event Link - use real event data */}
            {eventId ? (
              <TouchableOpacity
                onPress={() => router.push(`/event/${eventId}`)}
                className="bg-background rounded-xl p-3 flex-row items-center gap-3 border border-border"
              >
                <Image
                  source={{ uri: eventCover }}
                  className="w-12 h-12 rounded-lg"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                    {eventName}
                  </Text>
                  <Text className="text-xs text-muted">{eventVenue}</Text>
                </View>
                <Text className="text-muted">›</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-background rounded-xl p-3 flex-row items-center gap-3 border border-border">
                <View className="w-12 h-12 rounded-lg bg-surface items-center justify-center">
                  <Text className="text-xl">🎵</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">音樂活動</Text>
                  <Text className="text-xs text-muted">活動資料載入中...</Text>
                </View>
              </View>
            )}

            {/* Progress */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-muted">成員進度</Text>
                <Text className="text-xs text-foreground font-semibold">
                  {crew.currentMembers}/{crew.maxMembers}
                </Text>
              </View>
              <View className="h-2 bg-border rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(crew.currentMembers / crew.maxMembers) * 100}%` }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Members */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-4">成員列表</Text>
          <View className="gap-3">
            {mockMembers.map((member) => (
              <View
                key={member.id}
                className="bg-surface rounded-xl p-4 border border-border flex-row items-center gap-3"
              >
                <Image
                  source={{ uri: member.avatar }}
                  className="w-12 h-12 rounded-full"
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base font-semibold text-foreground">
                      {member.nickname}
                    </Text>
                    {member.isCreator && (
                      <View className="bg-primary/10 px-2 py-0.5 rounded">
                        <Text className="text-xs font-semibold text-primary">團主</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  className="bg-surface px-3 py-1.5 rounded-full border border-border"
                >
                  <Text className="text-xs text-foreground">查看</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Rules */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-foreground mb-4">揪團規則</Text>
          <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
            <Text className="text-sm text-muted">• 加入後請遵守團主規定</Text>
            <Text className="text-sm text-muted">• 如需退出請提前告知團主</Text>
            <Text className="text-sm text-muted">• 請保持禮貌友善的溝通態度</Text>
            <Text className="text-sm text-muted">• 涉及金錢交易請自行注意安全</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!crew.isFull && (
        <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border">
          {hasApplied ? (
            <View className="bg-success/10 py-4 rounded-full items-center">
              <Text className="text-success font-bold text-base">已送出申請，等待確認</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary py-4 rounded-full items-center"
            >
              <Text className="text-white font-bold text-base">申請加入</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}
