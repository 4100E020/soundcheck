import { useState, useRef, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Animated as RNAnimated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockUsers } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * 探索頁面
 * 卡片式配對介面，每日限量 30 人
 * 包含點歌破冰、誰喜歡我功能
 */
export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailySwipeCount, setDailySwipeCount] = useState(0);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const maxDailySwipes = 30;

  // Animation refs
  const cardOpacity = useRef(new RNAnimated.Value(1)).current;
  const cardTranslateX = useRef(new RNAnimated.Value(0)).current;
  const matchScale = useRef(new RNAnimated.Value(0)).current;
  const matchOpacity = useRef(new RNAnimated.Value(0)).current;

  const currentUser = mockUsers[currentIndex];
  const hasMoreUsers = currentIndex < mockUsers.length - 1;
  const canSwipe = dailySwipeCount < maxDailySwipes;

  const animateSwipe = useCallback(
    (direction: "left" | "right", callback: () => void) => {
      const toValue = direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH;
      RNAnimated.parallel([
        RNAnimated.timing(cardTranslateX, {
          toValue,
          duration: 250,
          useNativeDriver: true,
        }),
        RNAnimated.timing(cardOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        cardTranslateX.setValue(0);
        cardOpacity.setValue(1);
      });
    },
    [cardTranslateX, cardOpacity],
  );

  const showMatchSuccess = useCallback(() => {
    setShowMatchAnimation(true);
    RNAnimated.parallel([
      RNAnimated.spring(matchScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      RNAnimated.timing(matchOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      RNAnimated.parallel([
        RNAnimated.timing(matchScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(matchOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowMatchAnimation(false);
        matchScale.setValue(0);
      });
    }, 2000);
  }, [matchScale, matchOpacity]);

  const handleLike = () => {
    if (!canSwipe || !currentUser) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    animateSwipe("right", () => {
      setDailySwipeCount((c) => c + 1);
      // 30% chance of match for demo
      if (Math.random() > 0.7) {
        showMatchSuccess();
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      if (hasMoreUsers) {
        setCurrentIndex((i) => i + 1);
      }
    });
  };

  const handlePass = () => {
    if (!canSwipe || !currentUser) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    animateSwipe("left", () => {
      setDailySwipeCount((c) => c + 1);
      if (hasMoreUsers) {
        setCurrentIndex((i) => i + 1);
      }
    });
  };

  const handleSongIcebreaker = () => {
    if (!currentUser) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/song-picker",
      params: { targetName: currentUser.nickname },
    });
  };

  return (
    <ScreenContainer className="px-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text className="text-3xl font-bold text-foreground">探索</Text>
              <Text className="text-sm text-muted mt-1">
                頻率對了，就一起去現場吧
              </Text>
            </View>
            {/* Who Likes Me Button (VVIP) */}
            <TouchableOpacity
              onPress={() => router.push("/who-likes-me")}
              className="bg-primary/10 px-4 py-2 rounded-full flex-row items-center gap-1"
            >
              <IconSymbol name="heart.fill" size={16} color={colors.primary} />
              <Text className="text-sm font-semibold text-primary">5</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Limit */}
          <View className="bg-surface rounded-xl px-4 py-2 border border-border self-center">
            <Text className="text-sm text-muted">
              今日已滑 {dailySwipeCount}/{maxDailySwipes} 人
            </Text>
          </View>

          {/* Match Card */}
          {currentUser && canSwipe ? (
            <View className="flex-1 items-center justify-center">
              <RNAnimated.View
                style={{
                  width: "100%",
                  maxWidth: 380,
                  transform: [{ translateX: cardTranslateX }],
                  opacity: cardOpacity,
                }}
              >
                <View className="bg-surface rounded-3xl overflow-hidden border border-border shadow-lg">
                  {/* Avatar */}
                  <Image
                    source={{ uri: currentUser.avatar }}
                    className="w-full aspect-square"
                    resizeMode="cover"
                  />

                  {/* User Info */}
                  <View className="p-5 gap-3">
                    {/* Name & VVIP */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl font-bold text-foreground">
                          {currentUser.nickname}
                        </Text>
                        {currentUser.isVVIP && (
                          <View className="bg-success/10 px-2 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-success">VVIP</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-lg text-muted">{currentUser.age}</Text>
                    </View>

                    {/* Match Score */}
                    <View className="bg-primary/10 px-4 py-2 rounded-xl self-start">
                      <Text className="text-sm font-bold text-primary">
                        ❤️ {currentUser.matchScore}% 匹配
                      </Text>
                    </View>

                    {/* Bio */}
                    {currentUser.bio && (
                      <Text className="text-sm text-muted leading-relaxed">
                        {currentUser.bio}
                      </Text>
                    )}

                    {/* Top Artists */}
                    <View>
                      <Text className="text-xs text-muted mb-2">喜歡的藝人</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {currentUser.topArtists.map((artist, index) => (
                          <View key={index} className="bg-secondary/10 px-3 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-secondary">{artist}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Status */}
                    {currentUser.status && (
                      <View className="bg-warning/10 px-3 py-2 rounded-xl">
                        <Text className="text-sm text-warning">{currentUser.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </RNAnimated.View>

              {/* Action Buttons */}
              <View className="flex-row items-center justify-center gap-5 mt-6">
                {/* Pass */}
                <TouchableOpacity
                  onPress={handlePass}
                  className="bg-surface rounded-full p-4 border-2 border-border active:opacity-70"
                >
                  <Text className="text-2xl">✕</Text>
                </TouchableOpacity>

                {/* Song Icebreaker */}
                <TouchableOpacity
                  onPress={handleSongIcebreaker}
                  className="bg-secondary/10 rounded-full p-4 border-2 border-secondary/30 active:opacity-70"
                >
                  <Text className="text-2xl">🎵</Text>
                </TouchableOpacity>

                {/* Like */}
                <TouchableOpacity
                  onPress={handleLike}
                  className="bg-primary rounded-full p-5 active:opacity-70"
                >
                  <IconSymbol name="heart.fill" size={36} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <View className="bg-surface rounded-2xl p-8 border border-border items-center gap-4">
                <Text className="text-6xl">🎶</Text>
                <Text className="text-xl font-bold text-foreground text-center">
                  {!canSwipe ? "今日配對次數已用完" : "沒有更多用戶了"}
                </Text>
                <Text className="text-sm text-muted text-center">
                  {!canSwipe
                    ? "上傳票根驗證解鎖無限配對"
                    : "請稍後再回來看看"}
                </Text>
                {!canSwipe && (
                  <TouchableOpacity
                    onPress={() => router.push("/ticket-verify/1")}
                    className="bg-primary px-6 py-3 rounded-full mt-2"
                  >
                    <Text className="text-white font-bold">去驗證票根</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Match Success Overlay */}
      {showMatchAnimation && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <RNAnimated.View
            style={{
              transform: [{ scale: matchScale }],
              opacity: matchOpacity,
              alignItems: "center",
            }}
          >
            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-3xl font-bold text-white mb-2">配對成功！</Text>
            <Text className="text-base text-white/80">
              你和 {currentUser?.nickname} 互相喜歡
            </Text>
            <View className="bg-white/20 rounded-full px-6 py-3 mt-4">
              <Text className="text-white font-semibold">開始聊天吧</Text>
            </View>
          </RNAnimated.View>
        </View>
      )}
    </ScreenContainer>
  );
}
