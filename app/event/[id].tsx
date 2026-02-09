import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  mockEvents,
  mockUsers,
  mockCrews,
  getDaysUntil,
  formatEventDate,
  getCrewTypeInfo,
} from "@/lib/mock-data";
import * as Haptics from "expo-haptics";

type TabType = "info" | "people" | "crew";

/**
 * 活動詳情頁面
 * 包含 Header + 3 個分頁 (情報/找人/揪團)
 */
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [peopleFilter, setPeopleFilter] = useState<"all" | "vvip">("all");

  // 找到對應的活動
  const event = mockEvents.find((e) => e.id === Number(id));

  if (!event) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-foreground">活動不存在</Text>
      </ScreenContainer>
    );
  }

  const daysUntil = getDaysUntil(event.startDate);
  const isUpcoming = daysUntil > 0;

  // 篩選該活動的揪團
  const eventCrews = mockCrews.filter((crew) => crew.eventId === event.id);

  // 篩選用戶
  const filteredUsers = peopleFilter === "vvip"
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
        {/* Header 區域 */}
        <ImageBackground
          source={{ uri: event.coverImage }}
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

            {/* 活動資訊 */}
            <Text className="text-2xl font-bold text-white mb-2">
              {event.name}
            </Text>
            <Text className="text-sm text-white/80 mb-1">
              📅 {formatEventDate(event.startDate)}
              {event.endDate && ` - ${formatEventDate(event.endDate)}`}
            </Text>
            <Text className="text-sm text-white/80 mb-4">
              📍 {event.venue}
            </Text>

            {/* 倒數計時 */}
            {isUpcoming && (
              <View className="bg-warning/20 px-4 py-2 rounded-full self-start mb-4">
                <Text className="text-sm font-semibold text-warning">
                  還有 {daysUntil} 天
                </Text>
              </View>
            )}

            {/* CTA 按鈕 - 導航到票根驗證 */}
            <TouchableOpacity
              className="bg-primary px-6 py-3 rounded-full active:opacity-80"
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push(`/ticket-verify/${event.id}`);
              }}
            >
              <Text className="text-white font-bold text-center">
                📷 上傳票根解鎖 VVIP
              </Text>
            </TouchableOpacity>
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
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  陣容 Lineup
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {event.lineup.map((artist, index) => (
                    <View
                      key={index}
                      className="bg-secondary/10 px-4 py-2 rounded-full"
                    >
                      <Text className="text-sm font-semibold text-secondary">
                        {artist}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 活動熱度 */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  活動熱度
                </Text>
                <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">參加人數</Text>
                    <Text className="text-foreground font-bold">
                      {event.participantCount.toLocaleString()} 人
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted">已驗證 VVIP</Text>
                    <Text className="text-success font-bold">
                      {event.vvipCount.toLocaleString()} 人
                    </Text>
                  </View>
                  {/* Heat Bar */}
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs text-muted">VVIP 佔比</Text>
                      <Text className="text-xs text-primary font-semibold">
                        {Math.round((event.vvipCount / event.participantCount) * 100)}%
                      </Text>
                    </View>
                    <View className="h-2 bg-border rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(event.vvipCount / event.participantCount) * 100}%` }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* 活動說明 */}
              {event.description && (
                <View>
                  <Text className="text-xl font-bold text-foreground mb-3">
                    活動說明
                  </Text>
                  <Text className="text-muted leading-relaxed">
                    {event.description}
                  </Text>
                </View>
              )}

              {/* 官方資訊 */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  官方資訊
                </Text>
                <View className="gap-2">
                  {event.ticketUrl && (
                    <TouchableOpacity className="bg-primary/10 px-4 py-3 rounded-xl active:opacity-80">
                      <Text className="text-primary font-semibold">
                        🎫 購票連結
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity className="bg-surface px-4 py-3 rounded-xl border border-border active:opacity-80">
                    <Text className="text-foreground font-semibold">
                      🗺️ 場地地圖 · {event.address}
                    </Text>
                  </TouchableOpacity>
                </View>
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
                      // Navigate to song picker for icebreaker
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
                    params: { eventId: event.id.toString() },
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
