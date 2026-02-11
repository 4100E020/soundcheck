import { useState, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  getEventCoverImage,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/event-image-utils";
import { formatEventDate, getDaysUntil } from "@/lib/mock-data";
import * as Haptics from "expo-haptics";

/**
 * 附近活動頁面
 * 顯示所有活動（按日期排序）
 * 未來可整合位置 API 做距離排序
 */
export default function NearbyEventsScreen() {
  const router = useRouter();
  const colors = useColors();

  const { data: realEvents, isLoading, error, refetch } = trpc.events.listReal.useQuery({
    limit: 50,
    offset: 0,
  });

  const events = useMemo(() => {
    if (!realEvents) return [];
    return realEvents
      .map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        venue: e.venue,
        startDate: new Date(e.startDate),
        coverImage: getEventCoverImage(e.id, e.category, e.images),
        isFree: e.ticketing.isFree,
        priceMin: e.ticketing.priceRange.min,
        source: e.source,
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [realEvents]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderEventCard = ({ item }: { item: (typeof events)[0] }) => {
    const daysUntil = getDaysUntil(item.startDate);
    return (
      <TouchableOpacity
        onPress={() => handleEventPress(item.id)}
        className="bg-surface rounded-2xl overflow-hidden border border-border mb-3"
        activeOpacity={0.8}
      >
        {/* Event Image */}
        <Image
          source={{ uri: item.coverImage }}
          className="w-full h-40"
          resizeMode="cover"
        />

        {/* Event Info */}
        <View className="p-4 gap-2">
          <Text className="text-base font-bold text-foreground" numberOfLines={2}>
            {item.title}
          </Text>

          <Text className="text-xs text-muted" numberOfLines={1}>
            {item.venue.name}{item.venue.city ? ` · ${item.venue.city}` : ""}
          </Text>

          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-xs text-muted">
              {formatEventDate(item.startDate)}
            </Text>
            {daysUntil > 0 ? (
              <View className="bg-warning/10 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-warning">
                  還有 {daysUntil} 天
                </Text>
              </View>
            ) : (
              <View className="bg-muted/10 px-2 py-0.5 rounded-full">
                <Text className="text-xs font-semibold text-muted">已結束</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-primary/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-primary font-semibold">
                {getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}
              </Text>
            </View>
            <View className="bg-muted/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs text-muted font-semibold">
                {item.source.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">正在載入活動...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="items-center justify-center px-6">
        <Text className="text-lg font-bold text-foreground mb-2">載入失敗</Text>
        <Text className="text-sm text-muted text-center mb-4">
          無法取得活動資料，請稍後重試
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-bold">重新載入</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-2xl text-foreground">←</Text>
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-xl font-bold text-foreground">附近活動</Text>
          <Text className="text-xs text-muted">
            共 {events.length} 個活動
          </Text>
        </View>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-lg font-bold text-foreground mb-2">
              目前沒有活動
            </Text>
            <Text className="text-sm text-muted text-center">
              請稍後再回來看看
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
