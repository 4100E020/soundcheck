import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLocation } from "@/lib/location-context";
import { findNearbyEvents, formatDistance, getDirection } from "@/lib/location-utils";
import { mockEvents } from "@/lib/mock-data";
import { mockEventsWithLocation } from "@/lib/mock-data-with-location";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface EventWithDistance {
  id: number;
  name: string;
  venue: string;
  coverImage: string;
  eventType: string;
  startDate: Date;
  participantCount: number;
  vvipCount: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

/**
 * 附近活動頁面
 * 根據用戶位置顯示附近的活動,按距離排序
 */
export default function NearbyEventsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { userLocation, userCity, loading: locationLoading } = useLocation();

  const [events, setEvents] = useState<EventWithDistance[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithDistance[]>([]);
  const [radiusKm, setRadiusKm] = useState(50);
  const [loading, setLoading] = useState(true);

  // 初始化活動數據
  useEffect(() => {
    setLoading(true);
    try {
      // 合併模擬數據
      const combinedEvents: EventWithDistance[] = mockEvents.map((event, index) => ({
        ...event,
        latitude: mockEventsWithLocation[index % mockEventsWithLocation.length].latitude,
        longitude: mockEventsWithLocation[index % mockEventsWithLocation.length].longitude,
      }));

      setEvents(combinedEvents);

      // 如果有用戶位置,過濾附近活動
      if (userLocation) {
        const nearby = findNearbyEvents(userLocation, combinedEvents, radiusKm);
        setFilteredEvents(nearby);
      } else {
        setFilteredEvents(combinedEvents);
      }
    } finally {
      setLoading(false);
    }
  }, [userLocation, radiusKm]);

  const handleRadiusChange = (radius: number) => {
    setRadiusKm(radius);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEventPress = (eventId: number) => {
    router.push(`/event/${eventId}`);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderEventCard = ({ item }: { item: EventWithDistance }) => (
    <TouchableOpacity
      onPress={() => handleEventPress(item.id)}
      className="bg-surface rounded-2xl overflow-hidden border border-border mb-3"
    >
      {/* Event Image */}
      <View className="w-full h-32 bg-primary/10 items-center justify-center">
        <Text className="text-4xl">🎵</Text>
      </View>

      {/* Event Info */}
      <View className="p-4">
        <Text className="text-base font-bold text-foreground mb-1 line-clamp-2">
          {item.name}
        </Text>

        <Text className="text-xs text-muted mb-3">{item.venue}</Text>

        {/* Distance & Direction */}
        {item.distance !== undefined && userLocation && (
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-primary">
                📍 {formatDistance(item.distance)}
              </Text>
            </View>
            <View className="bg-secondary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-secondary">
                {getDirection(userLocation, {
                  latitude: item.latitude || 0,
                  longitude: item.longitude || 0,
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Event Type & Participants */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary font-semibold">
              {item.eventType === "festival"
                ? "音樂祭"
                : item.eventType === "concert"
                  ? "演唱會"
                  : "Live House"}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-muted">👥 {item.participantCount}</Text>
            {item.vvipCount > 0 && (
              <Text className="text-xs text-primary font-bold">VVIP {item.vvipCount}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (locationLoading || loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">正在加載附近活動...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground mt-2">附近活動</Text>
          {userCity && (
            <Text className="text-sm text-muted mt-1">📍 {userCity} 附近</Text>
          )}
        </View>

        {/* Radius Filter */}
        <View className="px-6 pb-4">
          <Text className="text-sm font-bold text-foreground mb-3">搜尋範圍</Text>
          <View className="flex-row gap-2">
            {[10, 25, 50, 100].map((radius) => (
              <TouchableOpacity
                key={radius}
                onPress={() => handleRadiusChange(radius)}
                className={`flex-1 py-2 rounded-lg items-center border ${
                  radiusKm === radius
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    radiusKm === radius ? "text-white" : "text-foreground"
                  }`}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Events List */}
        {filteredEvents.length > 0 ? (
          <View className="px-6">
            <Text className="text-sm text-muted mb-3">
              找到 {filteredEvents.length} 個活動
            </Text>
            <FlatList
              data={filteredEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View className="px-6 py-12 items-center">
            <Text className="text-4xl mb-3">🔍</Text>
            <Text className="text-base font-bold text-foreground mb-1">
              {userLocation ? "附近沒有活動" : "未啟用位置服務"}
            </Text>
            <Text className="text-sm text-muted text-center">
              {userLocation
                ? `在 ${radiusKm} km 範圍內沒有找到活動,請嘗試擴大搜尋範圍`
                : "請在設定中啟用位置服務以查看附近活動"}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
