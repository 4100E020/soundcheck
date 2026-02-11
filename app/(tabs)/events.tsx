import { useState, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getDaysUntil, formatEventDate } from "@/lib/mock-data";
import {
  getEventCoverImage,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/event-image-utils";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type EventFilter = "all" | "concert" | "festival" | "live_music";
type SortBy = "date" | "popularity" | "name";

interface DisplayEvent {
  id: string;
  title: string;
  category: string;
  venue: { name: string; city?: string };
  startDate: Date;
  endDate: Date;
  coverImage: string;
  isFree: boolean;
  priceMin: number;
  priceMax: number;
  source: string;
  genres: string[];
}

/**
 * 活動頁面
 * 顯示活動列表、篩選、排序，使用真實 API 資料
 */
export default function EventsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [filter, setFilter] = useState<EventFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [showSort, setShowSort] = useState(false);

  // Fetch real events from API
  const { data: realEvents, isLoading, error, refetch } = trpc.events.listReal.useQuery({
    limit: 50,
    offset: 0,
  });

  const filteredAndSortedEvents = useMemo(() => {
    if (!realEvents) return [];

    let events: DisplayEvent[] = realEvents.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      venue: e.venue,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      coverImage: getEventCoverImage(e.id, e.category, e.images),
      isFree: e.ticketing.isFree,
      priceMin: e.ticketing.priceRange.min,
      priceMax: e.ticketing.priceRange.max,
      source: e.source,
      genres: e.genres || [],
    }));

    // Filter
    if (filter !== "all") {
      events = events.filter((e) => e.category === filter);
    }

    // Sort
    switch (sortBy) {
      case "date":
        events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        break;
      case "name":
        events.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return events;
  }, [realEvents, filter, sortBy]);

  const handleFilter = (f: EventFilter) => {
    setFilter(f);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSort = (s: SortBy) => {
    setSortBy(s);
    setShowSort(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const sortLabels: Record<SortBy, string> = {
    date: "日期",
    popularity: "熱度",
    name: "名稱",
  };

  const filters: { key: EventFilter; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "festival", label: "音樂祭" },
    { key: "concert", label: "演唱會" },
    { key: "live_music", label: "現場演出" },
  ];

  const renderEventCard = ({ item: event }: { item: DisplayEvent }) => {
    const daysUntil = getDaysUntil(event.startDate);
    const isUpcoming = daysUntil > 0;

    return (
      <TouchableOpacity
        className="bg-surface rounded-3xl overflow-hidden shadow-sm mx-4 mb-5"
        style={{ opacity: 1 }}
        activeOpacity={0.85}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push(`/event/${event.id}`);
        }}
      >
        {/* Cover Image */}
        <View className="relative">
          <Image
            source={{ uri: event.coverImage }}
            className="w-full h-56"
            resizeMode="cover"
          />
          {/* Overlay badges */}
          <View className="absolute top-3 left-3 flex-row gap-2">
            <View className="bg-black/60 px-3 py-1 rounded-full flex-row items-center gap-1">
              <Text className="text-xs text-white">
                {getCategoryEmoji(event.category)} {getCategoryLabel(event.category)}
              </Text>
            </View>
          </View>
          <View className="absolute top-3 right-3">
            <View className="bg-black/60 px-3 py-1 rounded-full">
              <Text className="text-xs text-white/80 font-semibold">
                {event.source.toUpperCase()}
              </Text>
            </View>
          </View>
          {/* Price badge */}
          <View className="absolute bottom-3 right-3">
            {event.isFree ? (
              <View className="bg-success px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-white">免費</Text>
              </View>
            ) : event.priceMin > 0 ? (
              <View className="bg-white/90 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-foreground">
                  NT$ {event.priceMin}{event.priceMax > event.priceMin ? `+` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Info */}
        <View className="p-5 gap-3">
          <Text className="text-xl font-bold text-foreground leading-7" numberOfLines={2}>
            {event.title}
          </Text>

          <View className="gap-1">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm text-muted">
                📅 {formatEventDate(event.startDate)}
                {event.endDate &&
                  event.startDate.getTime() !== event.endDate.getTime() &&
                  ` - ${formatEventDate(event.endDate)}`}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-sm text-muted" numberOfLines={1}>
                📍 {event.venue.name}
                {event.venue.city ? ` · ${event.venue.city}` : ""}
              </Text>
            </View>
          </View>

          {/* Bottom row: countdown + genres */}
          <View className="flex-row items-center justify-between mt-1">
            {isUpcoming ? (
              <View className="bg-warning/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-warning">
                  還有 {daysUntil} 天
                </Text>
              </View>
            ) : (
              <View className="bg-muted/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-muted">已結束</Text>
              </View>
            )}

            {event.genres.length > 0 && (
              <View className="flex-row gap-1">
                {event.genres.slice(0, 2).map((genre, i) => (
                  <View key={i} className="bg-primary/10 px-2 py-0.5 rounded-full">
                    <Text className="text-xs text-primary">{genre}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted text-base">載入活動中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-4xl">😢</Text>
          <Text className="text-xl font-bold text-foreground">載入失敗</Text>
          <Text className="text-muted text-center">
            無法取得活動資料，請檢查網路連線後重試
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-primary px-6 py-3 rounded-full mt-2"
          >
            <Text className="text-white font-bold">重新載入</Text>
          </TouchableOpacity>
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
            <View className="flex-1">
              <Text className="text-3xl font-bold text-foreground">活動</Text>
              <Text className="text-base text-muted mt-1">
                探索音樂活動，驗證票根解鎖 VVIP
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/nearby-events")}
              className="bg-primary/10 px-4 py-3 rounded-full border border-primary"
            >
              <Text className="text-xs font-bold text-primary">📍 附近</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter & Sort Bar */}
        <View className="px-6 pb-3">
          {/* Filters */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[...filters, { key: "__sort" as any, label: "" }]}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              if (item.key === "__sort") {
                return (
                  <TouchableOpacity
                    onPress={() => setShowSort(!showSort)}
                    className="px-4 py-2 rounded-full bg-surface border border-border flex-row items-center gap-1"
                  >
                    <Text className="text-sm text-foreground">
                      排序: {sortLabels[sortBy]}
                    </Text>
                    <Text className="text-xs text-muted">
                      {showSort ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  onPress={() => handleFilter(item.key as EventFilter)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    filter === item.key
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      filter === item.key ? "text-white" : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Sort Dropdown */}
          {showSort && (
            <View className="mt-2 bg-surface rounded-xl border border-border overflow-hidden">
              {(["date", "popularity", "name"] as SortBy[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleSort(s)}
                  className={`px-4 py-3 border-b border-border ${
                    sortBy === s ? "bg-primary/10" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      sortBy === s ? "text-primary font-bold" : "text-foreground"
                    }`}
                  >
                    {s === "date" && "📅 按日期排序"}
                    {s === "popularity" && "🔥 按熱度排序"}
                    {s === "name" && "🔤 按名稱排序"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Results Count */}
        <View className="px-6 pb-2">
          <Text className="text-xs text-muted">
            共 {filteredAndSortedEvents.length} 個活動
          </Text>
        </View>

        {/* Event List */}
        <FlatList
          data={filteredAndSortedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center py-16 px-6">
              <Text className="text-5xl mb-4">🎵</Text>
              <Text className="text-lg font-bold text-foreground mb-2">
                沒有符合的活動
              </Text>
              <Text className="text-sm text-muted text-center mb-4">
                {filter !== "all"
                  ? "試試其他篩選條件，或查看全部活動"
                  : "目前沒有活動資料，請稍後再試"}
              </Text>
              {filter !== "all" && (
                <TouchableOpacity
                  onPress={() => handleFilter("all")}
                  className="bg-primary px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-bold">查看全部活動</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
