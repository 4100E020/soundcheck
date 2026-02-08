import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockEvents, getDaysUntil, formatEventDate, getEventTypeLabel } from "@/lib/mock-data";
import { useRouter } from "expo-router";

/**
 * 活動頁面
 * 顯示活動列表、票務驗證、揪團功能
 */
export default function EventsScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-3xl font-bold text-foreground">活動</Text>
          <Text className="text-base text-muted mt-1">
            探索音樂活動，驗證票根解鎖 VVIP
          </Text>
        </View>

        {/* 活動列表 */}
        <View className="px-6 pb-6 gap-4">
          {mockEvents.map((event) => {
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
                {/* 封面圖 */}
                <Image
                  source={{ uri: event.coverImage }}
                  className="w-full h-48"
                  resizeMode="cover"
                />

                {/* 活動資訊 */}
                <View className="p-4 gap-2">
                  {/* 活動名稱與類型 */}
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

                  {/* 日期與地點 */}
                  <View className="gap-1">
                    <Text className="text-sm text-muted">
                      📅 {formatEventDate(event.startDate)}
                      {event.endDate && ` - ${formatEventDate(event.endDate)}`}
                    </Text>
                    <Text className="text-sm text-muted" numberOfLines={1}>
                      📍 {event.venue}
                    </Text>
                  </View>

                  {/* 倒數與熱度 */}
                  <View className="flex-row items-center justify-between mt-2">
                    {isUpcoming ? (
                      <View className="bg-warning/10 px-3 py-1 rounded-full">
                        <Text className="text-xs font-semibold text-warning">
                          還有 {daysUntil} 天
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-muted/10 px-3 py-1 rounded-full">
                        <Text className="text-xs font-semibold text-muted">
                          已結束
                        </Text>
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
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
