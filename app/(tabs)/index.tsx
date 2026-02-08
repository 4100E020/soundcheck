import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockUsers } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

/**
 * 探索頁面
 * 卡片式配對介面，每日限量 30 人
 */
export default function DiscoverScreen() {
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailySwipeCount, setDailySwipeCount] = useState(0);
  const maxDailySwipes = 30;

  const currentUser = mockUsers[currentIndex];
  const hasMoreUsers = currentIndex < mockUsers.length - 1;
  const canSwipe = dailySwipeCount < maxDailySwipes;

  const handleLike = () => {
    if (!canSwipe) return;
    console.log("喜歡:", currentUser?.nickname);
    setDailySwipeCount(dailySwipeCount + 1);
    if (hasMoreUsers) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePass = () => {
    if (!canSwipe) return;
    console.log("跳過:", currentUser?.nickname);
    setDailySwipeCount(dailySwipeCount + 1);
    if (hasMoreUsers) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">探索</Text>
            <Text className="text-base text-muted text-center">
              頻率對了，就一起去現場吧
            </Text>
          </View>

          {/* 每日限制顯示 */}
          <View className="bg-surface rounded-xl px-4 py-2 border border-border self-center">
            <Text className="text-sm text-muted">
              今日已滑 {dailySwipeCount}/{maxDailySwipes} 人
            </Text>
          </View>

          {/* 配對卡片 */}
          {currentUser && canSwipe ? (
            <View className="flex-1 items-center justify-center">
              <View className="w-full max-w-sm bg-surface rounded-3xl overflow-hidden border border-border shadow-lg">
                {/* 頭像 */}
                <Image
                  source={{ uri: currentUser.avatar }}
                  className="w-full aspect-square"
                  resizeMode="cover"
                />

                {/* 用戶資訊 */}
                <View className="p-6 gap-3">
                  {/* 名稱與 VVIP 徽章 */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-2xl font-bold text-foreground">
                        {currentUser.nickname}
                      </Text>
                      {currentUser.isVVIP && (
                        <View className="bg-success/10 px-2 py-1 rounded-full">
                          <Text className="text-xs font-semibold text-success">
                            VVIP
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-lg text-muted">{currentUser.age}</Text>
                  </View>

                  {/* 匹配度 */}
                  <View className="bg-primary/10 px-4 py-2 rounded-xl self-start">
                    <Text className="text-sm font-bold text-primary">
                      ❤️ {currentUser.matchScore}% 匹配
                    </Text>
                  </View>

                  {/* 個人簡介 */}
                  {currentUser.bio && (
                    <Text className="text-sm text-muted leading-relaxed">
                      {currentUser.bio}
                    </Text>
                  )}

                  {/* Top 藝人 */}
                  <View>
                    <Text className="text-xs text-muted mb-2">喜歡的藝人</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {currentUser.topArtists.map((artist, index) => (
                        <View
                          key={index}
                          className="bg-secondary/10 px-3 py-1 rounded-full"
                        >
                          <Text className="text-xs font-semibold text-secondary">
                            {artist}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 狀態 */}
                  {currentUser.status && (
                    <View className="bg-warning/10 px-3 py-2 rounded-xl">
                      <Text className="text-sm text-warning">
                        {currentUser.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 操作按鈕 */}
              <View className="flex-row items-center justify-center gap-6 mt-8">
                {/* 跳過 */}
                <TouchableOpacity
                  onPress={handlePass}
                  className="bg-surface rounded-full p-5 border-2 border-border active:opacity-70"
                >
                  <IconSymbol name="chevron.right" size={32} color={colors.muted} />
                </TouchableOpacity>

                {/* 喜歡 */}
                <TouchableOpacity
                  onPress={handleLike}
                  className="bg-primary rounded-full p-6 active:opacity-70"
                >
                  <IconSymbol name="heart.fill" size={40} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* 點歌破冰提示 */}
              <TouchableOpacity className="mt-6">
                <Text className="text-sm text-secondary text-center">
                  🎵 點歌破冰
                </Text>
              </TouchableOpacity>
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
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
