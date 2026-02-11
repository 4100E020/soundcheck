import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import {
  getDaysUntil,
  formatEventDate,
  getCrewTypeInfo,
  mockUsers,
  mockCrews,
} from "@/lib/mock-data";
import {
  getEventCoverImage,
  getCategoryLabel,
  getCategoryEmoji,
} from "@/lib/event-image-utils";
import * as Haptics from "expo-haptics";

type TabType = "info" | "people" | "crew";

/**
 * 活動詳情頁面
 * 包含 Header + 3 個分頁 (情報/找人/揪團)
 * 使用真實 API 資料 (standardized_events)
 */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [peopleFilter, setPeopleFilter] = useState<"all" | "vvip">("all");

  // 從 API 取得真實活動資料
  const {
    data: event,
    isLoading,
    error,
  } = trpc.events.getRealById.useQuery(
    { id: id || "" },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">載入活動資料中...</Text>
      </ScreenContainer>
    );
  }

  if (error || !event) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">活動不存在</Text>
        <Text className="text-muted mb-6 text-center">
          {error?.message || "找不到此活動，可能已被移除或連結無效"}
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">返回活動列表</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // 解析活動資料
  const coverImage = getEventCoverImage(event.id, event.category, event.images);
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const daysUntil = getDaysUntil(startDate);
  const isUpcoming = daysUntil > 0;
  const lineup = event.lineup || [];
  const genres = event.genres || [];
  const tags = event.tags || [];
  const venue = event.venue;
  const ticketing = event.ticketing;

  // 篩選揪團（暫用模擬資料，之後接 API）
  const eventCrews = mockCrews.filter((crew) => crew.eventId === 1);

  // 篩選用戶（暫用模擬資料）
  const filteredUsers =
    peopleFilter === "vvip"
      ? mockUsers.filter((u) => u.isVVIP)
      : mockUsers;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView className="flex-1">
        {/* Hero Image */}
        <View className="relative">
          <Image
            source={{ uri: coverImage }}
            className="w-full"
            style={{ height: 280 }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 bg-black/40 w-10 h-10 rounded-full items-center justify-center"
          >
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>

          {/* Category & Source badges */}
          <View className="absolute top-12 right-4 flex-row gap-2">
            <View className="bg-primary/80 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-white">
                {getCategoryEmoji(event.category)} {getCategoryLabel(event.category)}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-white">
                {event.source.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Event title overlay */}
          <View className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <Text className="text-2xl font-bold text-white mb-2" numberOfLines={3}>
              {event.title}
            </Text>
            <View className="flex-row items-center gap-3">
              <Text className="text-sm text-white/90">
                📅 {formatEventDate(startDate)}
                {endDate &&
                  startDate.getTime() !== endDate.getTime() &&
                  ` - ${formatEventDate(endDate)}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Info Bar */}
        <View className="px-5 py-4 bg-surface border-b border-border">
          <View className="flex-row items-center gap-3 mb-3">
            <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
              📍 {venue.name}
              {venue.city ? ` · ${venue.city}` : ""}
            </Text>
          </View>
          {venue.address && (
            <Text className="text-xs text-muted mb-3">{venue.address}</Text>
          )}

          <View className="flex-row gap-3">
            {/* Countdown */}
            {isUpcoming && (
              <View className="bg-warning/10 px-4 py-2 rounded-full">
                <Text className="text-sm font-semibold text-warning">
                  還有 {daysUntil} 天
                </Text>
              </View>
            )}

            {/* Price */}
            {ticketing.isFree ? (
              <View className="bg-success/10 px-4 py-2 rounded-full">
                <Text className="text-sm font-semibold text-success">免費入場</Text>
              </View>
            ) : (
              <View className="bg-primary/10 px-4 py-2 rounded-full">
                <Text className="text-sm font-semibold text-primary">
                  NT$ {ticketing.priceRange.min}
                  {ticketing.priceRange.max > ticketing.priceRange.min
                    ? ` ~ ${ticketing.priceRange.max}`
                    : ""}
                </Text>
              </View>
            )}
          </View>

          {/* CTA Buttons */}
          <View className="flex-row gap-3 mt-4">
            {ticketing.ticketUrl && (
              <TouchableOpacity
                className="flex-1 bg-primary px-4 py-3 rounded-full items-center"
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  Linking.openURL(ticketing.ticketUrl!);
                }}
              >
                <Text className="text-white font-bold">🎫 前往購票</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 bg-surface px-4 py-3 rounded-full items-center border border-border"
              activeOpacity={0.8}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                Linking.openURL(event.sourceUrl);
              }}
            >
              <Text className="text-foreground font-bold">🔗 活動頁面</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row bg-background border-b border-border">
          {(
            [
              { key: "info" as TabType, label: "情報" },
              { key: "people" as TabType, label: "找人" },
              { key: "crew" as TabType, label: "揪團" },
            ] as const
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-4 ${
                activeTab === tab.key ? "border-b-2 border-primary" : ""
              }`}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === tab.key ? "text-primary" : "text-muted"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="px-5 py-5">
          {/* Tab 1: 情報 */}
          {activeTab === "info" && (
            <View className="gap-6">
              {/* Lineup */}
              {lineup.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    🎤 陣容 Lineup
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {lineup.map((artist, index) => (
                      <View
                        key={index}
                        className="bg-primary/10 px-4 py-2 rounded-full"
                      >
                        <Text className="text-sm font-semibold text-primary">
                          {artist.name}
                          {artist.role ? ` (${artist.role})` : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Genres */}
              {genres.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    🎵 音樂類型
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {genres.map((genre, index) => (
                      <View
                        key={index}
                        className="bg-surface px-4 py-2 rounded-full border border-border"
                      >
                        <Text className="text-sm text-foreground">{genre}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    🏷️ 標籤
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <View
                        key={index}
                        className="bg-muted/10 px-3 py-1 rounded-full"
                      >
                        <Text className="text-xs text-muted">#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Summary */}
              {event.summary && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    📋 活動摘要
                  </Text>
                  <Text className="text-muted leading-relaxed">
                    {event.summary}
                  </Text>
                </View>
              )}

              {/* Description */}
              {event.description && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    📝 活動說明
                  </Text>
                  <Text
                    className="text-muted leading-relaxed"
                    numberOfLines={20}
                  >
                    {event.description}
                  </Text>
                </View>
              )}

              {/* Organizer */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  👤 主辦方
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground">
                    {event.organizer.name}
                  </Text>
                </View>
              </View>

              {/* Venue */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  📍 場地資訊
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
                  <Text className="text-base font-semibold text-foreground">
                    {venue.name}
                  </Text>
                  {venue.address && (
                    <Text className="text-sm text-muted">{venue.address}</Text>
                  )}
                  {venue.city && (
                    <Text className="text-sm text-muted">
                      {venue.city}
                      {venue.district ? ` ${venue.district}` : ""}
                    </Text>
                  )}
                  {venue.venueType && (
                    <Text className="text-xs text-primary mt-1">
                      {venue.venueType}
                    </Text>
                  )}
                </View>
              </View>

              {/* Ticketing */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  🎫 票務資訊
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">票務狀態</Text>
                    <Text className="text-foreground font-bold">
                      {ticketing.status === "available" ||
                      ticketing.status === "on_sale"
                        ? "🟢 售票中"
                        : ticketing.status === "sold_out"
                          ? "🔴 已售完"
                          : ticketing.status === "upcoming" ||
                              ticketing.status === "coming_soon"
                            ? "🟡 即將開賣"
                            : ticketing.status}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">票價</Text>
                    <Text className="text-foreground font-bold">
                      {ticketing.isFree
                        ? "免費"
                        : `NT$ ${ticketing.priceRange.min}${
                            ticketing.priceRange.max >
                            ticketing.priceRange.min
                              ? ` ~ ${ticketing.priceRange.max}`
                              : ""
                          }`}
                    </Text>
                  </View>
                  {ticketing.ticketPlatform && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-muted">售票平台</Text>
                      <Text className="text-primary font-bold">
                        {ticketing.ticketPlatform}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Links */}
              <View className="gap-2">
                {ticketing.ticketUrl && (
                  <TouchableOpacity
                    className="bg-primary/10 px-4 py-3 rounded-xl"
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(ticketing.ticketUrl!)}
                  >
                    <Text className="text-primary font-semibold text-center">
                      🎫 前往購票頁面
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="bg-surface px-4 py-3 rounded-xl border border-border"
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(event.sourceUrl)}
                >
                  <Text className="text-foreground font-semibold text-center">
                    🔗 查看原始活動頁面
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab 2: 找人 */}
          {activeTab === "people" && (
            <View className="gap-4">
              {/* Filter */}
              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${
                    peopleFilter === "all"
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={() => setPeopleFilter("all")}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      peopleFilter === "all" ? "text-white" : "text-foreground"
                    }`}
                  >
                    全部
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${
                    peopleFilter === "vvip"
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  onPress={() => setPeopleFilter("vvip")}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      peopleFilter === "vvip" ? "text-white" : "text-foreground"
                    }`}
                  >
                    只看 VVIP
                  </Text>
                </TouchableOpacity>
              </View>

              {/* User Grid */}
              <View className="flex-row flex-wrap gap-3">
                {filteredUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    className="bg-surface rounded-2xl p-4 border border-border"
                    activeOpacity={0.8}
                    style={{ width: "48%" }}
                    onPress={() => {
                      router.push({
                        pathname: "/song-picker",
                        params: { targetName: user.nickname },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-full aspect-square rounded-xl mb-2"
                    />
                    <View className="gap-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className="text-sm font-bold text-foreground"
                          numberOfLines={1}
                        >
                          {user.nickname}
                        </Text>
                        {user.isVVIP && <Text className="text-xs">✅</Text>}
                      </View>
                      <View className="bg-primary/10 px-2 py-1 rounded-full self-start">
                        <Text className="text-xs font-semibold text-primary">
                          {user.matchScore}% 匹配
                        </Text>
                      </View>
                      {user.status && (
                        <Text
                          className="text-xs text-muted"
                          numberOfLines={1}
                        >
                          {user.status}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="bg-warning/10 px-4 py-3 rounded-xl mt-4">
                <Text className="text-xs text-warning text-center">
                  未驗證用戶每日限滑 30 人，驗證後無限制
                </Text>
              </View>
            </View>
          )}

          {/* Tab 3: 揪團 */}
          {activeTab === "crew" && (
            <View className="gap-4">
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full"
                activeOpacity={0.8}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  router.push({
                    pathname: "/crew/create",
                    params: { eventId: event.id },
                  });
                }}
              >
                <Text className="text-white font-bold text-center">
                  + 發起揪團
                </Text>
              </TouchableOpacity>

              {eventCrews.map((crew) => {
                const typeInfo = getCrewTypeInfo(crew.type);
                return (
                  <TouchableOpacity
                    key={crew.id}
                    className="bg-surface rounded-2xl p-4 border border-border"
                    activeOpacity={0.8}
                    onPress={() => {
                      router.push(`/crew/${crew.id}`);
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base">{typeInfo.emoji}</Text>
                        <Text className="text-xs font-semibold text-muted">
                          {typeInfo.label}
                        </Text>
                      </View>
                      {crew.isFull ? (
                        <View className="bg-muted/10 px-3 py-1 rounded-full">
                          <Text className="text-xs font-semibold text-muted">
                            已滿團
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-success/10 px-3 py-1 rounded-full">
                          <Text className="text-xs font-semibold text-success">
                            缺 {crew.maxMembers - crew.currentMembers} 人
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-base font-bold text-foreground mb-2">
                      {crew.title}
                    </Text>
                    <Text
                      className="text-sm text-muted mb-3"
                      numberOfLines={2}
                    >
                      {crew.description}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Image
                          source={{ uri: crew.creator.avatar }}
                          className="w-6 h-6 rounded-full"
                        />
                        <Text className="text-xs text-muted">
                          {crew.creator.nickname}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted">
                        {crew.currentMembers}/{crew.maxMembers} 人
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {eventCrews.length === 0 && (
                <View className="items-center py-8">
                  <Text className="text-5xl mb-3">🎪</Text>
                  <Text className="text-base font-bold text-foreground mb-2">
                    還沒有揪團
                  </Text>
                  <Text className="text-sm text-muted">
                    成為第一個發起揪團的人吧！
                  </Text>
                </View>
              )}

              <View className="bg-warning/10 px-4 py-3 rounded-xl">
                <Text className="text-xs text-warning text-center">
                  未驗證用戶僅能瀏覽，驗證後可發文與加入
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
