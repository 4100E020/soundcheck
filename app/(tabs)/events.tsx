import { useState, useMemo } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockEvents, getDaysUntil, formatEventDate, getEventTypeLabel, type MockEvent } from "@/lib/mock-data";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

type EventFilter = "all" | "festival" | "concert" | "livehouse";
type SortBy = "date" | "popularity" | "name";

/**
 * 活動頁面
 * 顯示活動列表、篩選、排序
 */
export default function EventsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<EventFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [showSort, setShowSort] = useState(false);

  const filteredAndSortedEvents = useMemo(() => {
    let events = [...mockEvents];

    // Filter
    if (filter !== "all") {
      events = events.filter((e) => e.eventType === filter);
    }

    // Sort
    switch (sortBy) {
      case "date":
        events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        break;
      case "popularity":
        events.sort((a, b) => b.participantCount - a.participantCount);
        break;
      case "name":
        events.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return events;
  }, [filter, sortBy]);

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
    { key: "livehouse", label: "Live House" },
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
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
        <View className="px-6 pb-4">
          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {filters.map((f) => (
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

              {/* Sort Button */}
              <TouchableOpacity
                onPress={() => setShowSort(!showSort)}
                className="px-4 py-2 rounded-full bg-surface border border-border flex-row items-center gap-1"
              >
                <Text className="text-sm text-foreground">排序: {sortLabels[sortBy]}</Text>
                <Text className="text-xs text-muted">{showSort ? "▲" : "▼"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sort Dropdown */}
          {showSort && (
            <View className="mt-2 bg-surface rounded-xl border border-border overflow-hidden">
              {(["date", "popularity", "name"] as SortBy[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleSort(s)}
                  className={`px-4 py-3 border-b border-border ${sortBy === s ? "bg-primary/10" : ""}`}
                >
                  <Text className={`text-sm ${sortBy === s ? "text-primary font-bold" : "text-foreground"}`}>
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
        <View className="px-6 pb-3">
          <Text className="text-xs text-muted">
            共 {filteredAndSortedEvents.length} 個活動
          </Text>
        </View>

        {/* Event List */}
        <View className="px-6 pb-6 gap-4">
          {filteredAndSortedEvents.map((event) => {
            const daysUntil = getDaysUntil(event.startDate);
            const isUpcoming = daysUntil > 0;

            return (
              <TouchableOpacity
                key={event.id}
                className="bg-surface rounded-2xl overflow-hidden border border-border active:opacity-80"
                onPress={() => {
                  router.push(`/event/${event.id}`);
                }}
              >
                {/* Cover */}
                <Image
                  source={{ uri: event.coverImage }}
                  className="w-full h-48"
                  resizeMode="cover"
                />

                {/* Info */}
                <View className="p-4 gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-foreground flex-1" numberOfLines={1}>
                      {event.name}
                    </Text>
                    <View className="bg-primary/10 px-3 py-1 rounded-full ml-2">
                      <Text className="text-xs font-semibold text-primary">
                        {getEventTypeLabel(event.eventType)}
                      </Text>
                    </View>
                  </View>

                  <View className="gap-1">
                    <Text className="text-sm text-muted">
                      📅 {formatEventDate(event.startDate)}
                      {event.endDate && ` - ${formatEventDate(event.endDate)}`}
                    </Text>
                    <Text className="text-sm text-muted" numberOfLines={1}>
                      📍 {event.venue}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
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

                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs text-muted">
                        🔥 {event.participantCount} 人參加
                      </Text>
                      <Text className="text-xs text-success">
                        ✅ {event.vvipCount} VVIP
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredAndSortedEvents.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🎵</Text>
              <Text className="text-base font-bold text-foreground mb-2">沒有符合的活動</Text>
              <Text className="text-sm text-muted">試試其他篩選條件</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
