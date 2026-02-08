import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { mockUsers, mockEvents } from "@/lib/mock-data";

/**
 * 個人資料頁面
 * 顯示音樂基因圖、票夾、設定
 */
export default function ProfileScreen() {
  // 模擬當前用戶
  const currentUser = {
    ...mockUsers[0],
    nickname: "我的昵稱",
    bio: "熱愛音樂，喜歡參加各種現場演出",
    spotifyConnected: false,
  };

  // 模擬已驗證的活動
  const verifiedEvents = mockEvents.slice(0, 2);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* 個人資訊 */}
        <View className="px-6 pt-6 pb-6 items-center">
          {/* 頭像 */}
          <Image
            source={{ uri: currentUser.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />

          {/* 名稱與 VVIP 徽章 */}
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-2xl font-bold text-foreground">
              {currentUser.nickname}
            </Text>
            {currentUser.isVVIP && (
              <View className="bg-success/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-semibold text-success">VVIP</Text>
              </View>
            )}
          </View>

          {/* 年齡與性別 */}
          <Text className="text-base text-muted mb-3">
            {currentUser.age} 歲 · {currentUser.gender === "female" ? "女" : "男"}
          </Text>

          {/* 個人簡介 */}
          <Text className="text-sm text-muted text-center leading-relaxed">
            {currentUser.bio}
          </Text>

          {/* 編輯資料按鈕 */}
          <TouchableOpacity className="mt-4 bg-surface px-6 py-2 rounded-full border border-border active:opacity-80">
            <Text className="text-sm font-semibold text-foreground">
              編輯資料
            </Text>
          </TouchableOpacity>
        </View>

        {/* 音樂基因圖 */}
        <View className="px-6 pb-6">
          <View className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">
                🎵 音樂基因圖
              </Text>
              <TouchableOpacity>
                <Text className="text-sm text-white/80">查看詳情</Text>
              </TouchableOpacity>
            </View>

            {/* Top 藝人 */}
            <View className="mb-4">
              <Text className="text-sm text-white/80 mb-2">最喜歡的藝人</Text>
              <View className="flex-row flex-wrap gap-2">
                {currentUser.topArtists.map((artist, index) => (
                  <View
                    key={index}
                    className="bg-white/20 px-3 py-1 rounded-full"
                  >
                    <Text className="text-sm font-semibold text-white">
                      {artist}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Spotify 連結 */}
            <TouchableOpacity className="bg-white/20 px-4 py-3 rounded-xl flex-row items-center justify-between active:opacity-80">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">🎶</Text>
                <Text className="text-sm font-semibold text-white">
                  {currentUser.spotifyConnected ? "Spotify 已連結" : "連結 Spotify"}
                </Text>
              </View>
              <Text className="text-white/60">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 票夾 */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">
              🎫 我的票夾
            </Text>
            <Text className="text-sm text-muted">
              {verifiedEvents.length} 張票根
            </Text>
          </View>

          {verifiedEvents.length > 0 ? (
            <View className="gap-3">
              {verifiedEvents.map((event) => (
                <View
                  key={event.id}
                  className="bg-surface rounded-2xl overflow-hidden border border-border"
                >
                  <Image
                    source={{ uri: event.coverImage }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className="text-base font-bold text-foreground flex-1"
                        numberOfLines={1}
                      >
                        {event.name}
                      </Text>
                      <View className="bg-success/10 px-3 py-1 rounded-full ml-2">
                        <Text className="text-xs font-semibold text-success">
                          ✅ 已驗證
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center">
              <Text className="text-4xl mb-3">🎫</Text>
              <Text className="text-base font-bold text-foreground mb-2">
                還沒有票根
              </Text>
              <Text className="text-sm text-muted text-center mb-4">
                上傳票根驗證解鎖 VVIP 功能
              </Text>
              <TouchableOpacity className="bg-primary px-6 py-3 rounded-full active:opacity-80">
                <Text className="text-white font-bold">上傳票根</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 設定選項 */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-foreground mb-4">
            ⚙️ 設定
          </Text>

          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border active:opacity-80">
              <Text className="text-base text-foreground">帳號設定</Text>
              <Text className="text-muted">›</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border active:opacity-80">
              <Text className="text-base text-foreground">隱私設定</Text>
              <Text className="text-muted">›</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 border-b border-border active:opacity-80">
              <Text className="text-base text-foreground">通知設定</Text>
              <Text className="text-muted">›</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center justify-between px-4 py-4 active:opacity-80">
              <Text className="text-base text-foreground">關於 / 幫助</Text>
              <Text className="text-muted">›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
