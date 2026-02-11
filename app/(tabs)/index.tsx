import { useState, useCallback, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Animated as RNAnimated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type DiscoverUser = {
  id: number;
  nickname: string | null;
  avatar: string | null;
  age: number | null;
  bio: string | null;
  isVVIP: boolean;
};

/**
 * 探索頁面
 * 卡片式配對介面，每日限量 30 人
 * 包含點歌破冰、誰喜歡我功能
 */
export default function DiscoverScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const maxDailySwipes = 30;

  // Fetch discover users
  const { data: users = [], isLoading, refetch } = trpc.matching.getDiscoverUsers.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Swipe mutation
  const swipeMutation = trpc.matching.swipe.useMutation({
    onSuccess: (data) => {
      if (data.matched) {
        showMatchSuccess();
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    },
  });

  // Animation refs
  const cardOpacity = useRef(new RNAnimated.Value(1)).current;
  const cardTranslateX = useRef(new RNAnimated.Value(0)).current;
  const matchScale = useRef(new RNAnimated.Value(0)).current;
  const matchOpacity = useRef(new RNAnimated.Value(0)).current;

  const currentUser = users[currentIndex];
  const hasMoreUsers = currentIndex < users.length - 1;
  // Note: dailySwipeCount is tracked in backend, we'll show 0 for now
  const dailySwipeCount = 0;
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
    if (!canSwipe || !currentUser || !user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    animateSwipe("right", () => {
      swipeMutation.mutate({
        targetUserId: currentUser.id,
        action: "like",
      });
      if (hasMoreUsers) {
        setCurrentIndex((i) => i + 1);
      }
    });
  };

  const handlePass = () => {
    if (!canSwipe || !currentUser || !user) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    animateSwipe("left", () => {
      swipeMutation.mutate({
        targetUserId: currentUser.id,
        action: "pass",
      });
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
      params: { targetName: currentUser.nickname || "對方" },
    });
  };

  // Show login prompt if not logged in
  if (!user) {
    return (
      <ScreenContainer className="px-6">
        <View className="flex-1 items-center justify-center gap-4">
          <IconSymbol name="heart.fill" size={64} color={colors.muted} />
          <Text className="text-xl font-semibold text-foreground text-center">
            登入後開始探索
          </Text>
          <Text className="text-sm text-muted text-center">
            登入後即可開始配對，找到志同道合的音樂夥伴
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login" as any)}
            className="bg-primary px-8 py-3 rounded-full mt-4"
          >
            <Text className="text-background font-semibold">立即登入</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <ScreenContainer className="px-6">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted mt-4">載入中...</Text>
        </View>
      </ScreenContainer>
    );
  }

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
            {user.isVVIP && (
              <TouchableOpacity
                onPress={() => router.push("/who-likes-me")}
                className="bg-primary/10 px-4 py-2 rounded-full flex-row items-center gap-1"
              >
                <IconSymbol name="heart.fill" size={16} color={colors.primary} />
                <Text className="text-sm font-semibold text-primary">?</Text>
              </TouchableOpacity>
            )}
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
                    source={{
                      uri:
                        currentUser.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${currentUser.id}`,
                    }}
                    className="w-full aspect-square"
                    resizeMode="cover"
                  />

                  {/* User Info */}
                  <View className="p-5 gap-3">
                    {/* Name & VVIP */}
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl font-bold text-foreground">
                        {currentUser.nickname || "匿名用戶"}
                      </Text>
                      {currentUser.age && (
                        <Text className="text-xl text-muted">{currentUser.age}</Text>
                      )}
                      {currentUser.isVVIP && (
                        <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                          <Text className="text-xs font-semibold text-primary">VVIP</Text>
                        </View>
                      )}
                    </View>

                    {/* Bio */}
                    {currentUser.bio && (
                      <Text className="text-sm text-muted leading-relaxed">
                        {currentUser.bio}
                      </Text>
                    )}



                    {/* Song Icebreaker Button */}
                    <TouchableOpacity
                      onPress={handleSongIcebreaker}
                      className="bg-primary/10 px-4 py-3 rounded-xl flex-row items-center justify-center gap-2 mt-2"
                    >
                      <IconSymbol name="music.note" size={18} color={colors.primary} />
                      <Text className="text-sm font-semibold text-primary">
                        用歌曲破冰
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </RNAnimated.View>

              {/* Action Buttons */}
              <View className="flex-row items-center justify-center gap-8 mt-8">
                {/* Pass Button */}
                <TouchableOpacity
                  onPress={handlePass}
                  className="w-16 h-16 bg-surface rounded-full items-center justify-center border-2 border-border shadow-sm active:opacity-70"
                >
                  <IconSymbol name="xmark" size={28} color={colors.error} />
                </TouchableOpacity>

                {/* Like Button */}
                <TouchableOpacity
                  onPress={handleLike}
                  className="w-20 h-20 bg-primary rounded-full items-center justify-center shadow-lg active:opacity-80"
                >
                  <IconSymbol name="heart.fill" size={32} color={colors.background} />
                </TouchableOpacity>
              </View>
            </View>
          ) : !canSwipe ? (
            // Daily Limit Reached
            <View className="flex-1 items-center justify-center gap-4">
              <IconSymbol name="clock" size={64} color={colors.muted} />
              <Text className="text-xl font-semibold text-foreground text-center">
                今日配對次數已用完
              </Text>
              <Text className="text-sm text-muted text-center px-8">
                每日限量 {maxDailySwipes} 次滑動，明天再來吧！
              </Text>
            </View>
          ) : (
            // No More Users
            <View className="flex-1 items-center justify-center gap-4">
              <IconSymbol name="checkmark.circle" size={64} color={colors.success} />
              <Text className="text-xl font-semibold text-foreground text-center">
                暫時沒有更多用戶
              </Text>
              <Text className="text-sm text-muted text-center px-8">
                稍後再來看看，或許會有新的音樂夥伴加入！
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCurrentIndex(0);
                  refetch();
                }}
                className="bg-primary px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-background font-semibold">重新載入</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Match Success Animation */}
          {showMatchAnimation && (
            <View className="absolute inset-0 items-center justify-center bg-black/50">
              <RNAnimated.View
                style={{
                  transform: [{ scale: matchScale }],
                  opacity: matchOpacity,
                }}
                className="bg-background rounded-3xl p-8 items-center gap-4 shadow-2xl"
              >
                <IconSymbol name="heart.fill" size={80} color={colors.primary} />
                <Text className="text-3xl font-bold text-foreground">配對成功！</Text>
                <Text className="text-sm text-muted text-center">
                  你們互相喜歡，快去聊天吧
                </Text>
              </RNAnimated.View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
