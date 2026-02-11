import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import {
  getDaysUntil,
  formatEventDate,
  getCrewTypeInfo,
  mockUsers,
  mockCrews,
} from "@/lib/mock-data";
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
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [peopleFilter, setPeopleFilter] = useState<"all" | "vvip">("all");

  // 從 API 取得真實活動資料
  const { data: event, isLoading, error } = trpc.events.getRealById.useQuery(
    { id: id || "" },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="text-muted mt-4">載入活動資料中...</Text>
      </ScreenContainer>
    );
  }

  if (error || !event) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-4xl mb-4">😢</Text>
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
  const coverImage = event.images?.[0]?.url || "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800";
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
  const eventCrews = mockCrews.filter((crew) => crew.eventId === 1); // placeholder

  // 篩選用戶（暫用模擬資料）
  const filteredUsers = peopleFilter === "vvip"
    ? mockUsers.filter((u) => u.isVVIP)
    : mockUsers;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      concert: "演唱會",
      festival: "音樂祭",
      club_event: "夜店活動",
      live_music: "現場演出",
      dj_set: "DJ Set",
      workshop: "工作坊",
      conference: "研討會",
      party: "派對",
      other: "其他",
    };
    return labels[category] || "音樂活動";
  };

  return (
    <ScreenContainer edges={["left", "right"]}>
      <ScrollView className="flex-1">
        {/* Header 區域 */}
        <ImageBackground
          source={{ uri: coverImage }}
          className="w-full"
          blurRadius={20}
        >
          <View className="bg-black/60 px-6 py-8">
            {/* 返回按鈕 */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 self-start"
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>

            {/* 活動類型標籤 */}
            <View className="flex-row gap-2 mb-3">
              <View className="bg-primary/30 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-white">
                  {getCategoryLabel(event.category)}
                </Text>
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-white">
                  {event.source.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* 活動資訊 */}
            <Text className="text-2xl font-bold text-white mb-2">
              {event.title}
            </Text>
            <Text className="text-sm text-white/80 mb-1">
              📅 {formatEventDate(startDate)}
              {endDate && startDate.getTime() !== endDate.getTime() && ` - ${formatEventDate(endDate)}`}
            </Text>
            <Text className="text-sm text-white/80 mb-1">
              📍 {venue.name}
            </Text>
            {venue.address && (
              <Text className="text-xs text-white/60 mb-4">
                {venue.address}
              </Text>
            )}

            {/* 倒數計時 */}
            {isUpcoming && (
              <View className="bg-warning/20 px-4 py-2 rounded-full self-start mb-4">
                <Text className="text-sm font-semibold text-warning">
                  還有 {daysUntil} 天
                </Text>
              </View>
            )}

            {/* 票價資訊 */}
            <View className="flex-row gap-3 mb-4">
              {ticketing.isFree ? (
                <View className="bg-success/20 px-4 py-2 rounded-full">
                  <Text className="text-sm font-semibold text-success">免費入場</Text>
                </View>
              ) : (
                <View className="bg-white/20 px-4 py-2 rounded-full">
                  <Text className="text-sm font-semibold text-white">
                    💰 NT$ {ticketing.priceRange.min}
                    {ticketing.priceRange.max > ticketing.priceRange.min
                      ? ` ~ ${ticketing.priceRange.max}`
                      : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* CTA 按鈕 */}
            <View className="flex-row gap-3">
              {ticketing.ticketUrl && (
                <TouchableOpacity
                  className="flex-1 bg-primary px-6 py-3 rounded-full active:opacity-80"
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                    Linking.openURL(ticketing.ticketUrl!);
                  }}
                >
                  <Text className="text-white font-bold text-center">
                    🎫 前往購票
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-1 bg-white/20 px-6 py-3 rounded-full active:opacity-80"
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  Linking.openURL(event.sourceUrl);
                }}
              >
                <Text className="text-white font-bold text-center">
                  🔗 活動頁面
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* 分頁導航 */}
        <View className="flex-row bg-surface border-b border-border">
          <TouchableOpacity
            className={`flex-1 py-4 ${activeTab === "info" ? "border-b-2 border-primary" : ""}`}
            onPress={() => handleTabChange("info")}
          >
            <Text
              className={`text-center font-semibold ${activeTab === "info" ? "text-primary" : "text-muted"}`}
            >
              情報
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-4 ${activeTab === "people" ? "border-b-2 border-primary" : ""}`}
            onPress={() => handleTabChange("people")}
          >
            <Text
              className={`text-center font-semibold ${activeTab === "people" ? "text-primary" : "text-muted"}`}
            >
              找人
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-4 ${activeTab === "crew" ? "border-b-2 border-primary" : ""}`}
            onPress={() => handleTabChange("crew")}
          >
            <Text
              className={`text-center font-semibold ${activeTab === "crew" ? "text-primary" : "text-muted"}`}
            >
              揪團
            </Text>
          </TouchableOpacity>
        </View>

        {/* 分頁內容 */}
        <View className="px-6 py-6">
          {/* Tab 1: 情報 */}
          {activeTab === "info" && (
            <View className="gap-6">
              {/* 陣容 */}
              {lineup.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    陣容 Lineup
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

              {/* 音樂類型 */}
              {genres.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    音樂類型
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {genres.map((genre, index) => (
                      <View
                        key={index}
                        className="bg-surface px-4 py-2 rounded-full border border-border"
                      >
                        <Text className="text-sm text-foreground">
                          🎵 {genre}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 標籤 */}
              {tags.length > 0 && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    標籤
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

              {/* 活動說明 */}
              {event.summary && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    活動摘要
                  </Text>
                  <Text className="text-muted leading-relaxed">
                    {event.summary}
                  </Text>
                </View>
              )}

              {event.description && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    活動說明
                  </Text>
                  <Text className="text-muted leading-relaxed" numberOfLines={20}>
                    {event.description}
                  </Text>
                </View>
              )}

              {/* 主辦方 */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  主辦方
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground">
                    {event.organizer.name}
                  </Text>
                </View>
              </View>

              {/* 場地資訊 */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  場地資訊
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">📍</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {venue.name}
                    </Text>
                  </View>
                  {venue.address && (
                    <Text className="text-sm text-muted ml-7">
                      {venue.address}
                    </Text>
                  )}
                  {venue.city && (
                    <Text className="text-sm text-muted ml-7">
                      {venue.city}{venue.district ? ` ${venue.district}` : ""}
                    </Text>
                  )}
                  {venue.venueType && (
                    <Text className="text-xs text-primary ml-7">
                      {venue.venueType}
                    </Text>
                  )}
                </View>
              </View>

              {/* 票務資訊 */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  票務資訊
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">票務狀態</Text>
                    <Text className="text-foreground font-bold">
                      {ticketing.status === "available" ? "🟢 售票中" :
                       ticketing.status === "sold_out" ? "🔴 已售完" :
                       ticketing.status === "upcoming" ? "🟡 即將開賣" :
                       ticketing.status}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">票價</Text>
                    <Text className="text-foreground font-bold">
                      {ticketing.isFree ? "免費" :
                        `NT$ ${ticketing.priceRange.min}${ticketing.priceRange.max > ticketing.priceRange.min ? ` ~ ${ticketing.priceRange.max}` : ""}`
                      }
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

              {/* 官方連結 */}
              <View className="gap-2">
                {ticketing.ticketUrl && (
                  <TouchableOpacity
                    className="bg-primary/10 px-4 py-3 rounded-xl active:opacity-80"
                    onPress={() => Linking.openURL(ticketing.ticketUrl!)}
                  >
                    <Text className="text-primary font-semibold text-center">
                      🎫 前往購票頁面
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="bg-surface px-4 py-3 rounded-xl border border-border active:opacity-80"
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
              {/* 篩選選項 */}
              <View className="flex-row gap-2 mb-2">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${peopleFilter === "all" ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setPeopleFilter("all")}
                >
                  <Text className={`text-sm font-semibold ${peopleFilter === "all" ? "text-white" : "text-foreground"}`}>
                    全部
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${peopleFilter === "vvip" ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setPeopleFilter("vvip")}
                >
                  <Text className={`text-sm font-semibold ${peopleFilter === "vvip" ? "text-white" : "text-foreground"}`}>
                    只看 VVIP
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 雙欄卡片流 */}
              <View className="flex-row flex-wrap gap-3">
                {filteredUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
                    style={{ width: "48%" }}
                    onPress={() => {
                      router.push({
                        pathname: "/song-picker",
                        params: { targetName: user.nickname },
                      });
                    }}
                  >
                    {/* 頭像 */}
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-full aspect-square rounded-xl mb-2"
                    />

                    {/* 用戶資訊 */}
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

                      {/* 匹配度 */}
                      <View className="bg-primary/10 px-2 py-1 rounded-full self-start">
                        <Text className="text-xs font-semibold text-primary">
                          {user.matchScore}% 匹配
                        </Text>
                      </View>

                      {/* 狀態 */}
                      {user.status && (
                        <Text className="text-xs text-muted" numberOfLines={1}>
                          {user.status}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 權限提示 */}
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
              {/* 發起揪團按鈕 */}
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-full active:opacity-80"
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

              {/* 揪團列表 */}
              {eventCrews.map((crew) => {
                const typeInfo = getCrewTypeInfo(crew.type);

                return (
                  <TouchableOpacity
                    key={crew.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
                    onPress={() => {
                      router.push(`/crew/${crew.id}`);
                    }}
                  >
                    {/* 類型標籤 */}
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

                    {/* 標題 */}
                    <Text className="text-base font-bold text-foreground mb-2">
                      {crew.title}
                    </Text>

                    {/* 說明 */}
                    <Text
                      className="text-sm text-muted mb-3"
                      numberOfLines={2}
                    >
                      {crew.description}
                    </Text>

                    {/* 發起人 & 進度 */}
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
                  <Text className="text-4xl mb-3">🎪</Text>
                  <Text className="text-base font-bold text-foreground mb-2">還沒有揪團</Text>
                  <Text className="text-sm text-muted">成為第一個發起揪團的人吧！</Text>
                </View>
              )}

              {/* 權限提示 */}
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
