import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/lib/auth-context";
import { mockUsers, mockEvents } from "@/lib/mock-data";
import * as Haptics from "expo-haptics";

/**
 * 個人資料頁面
 * 顯示音樂基因圖、票夾、Spotify 連結、設定
 */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  // Use auth user data if available, otherwise use mock
  const currentUser = isAuthenticated && user ? {
    ...mockUsers[0],
    nickname: user.displayName,
    bio: "熱愛音樂，喜歡參加各種現場演出",
    isVVIP: user.isVVIP || false,
    avatar: user.avatarUrl || mockUsers[0].avatar,
  } : {
    ...mockUsers[0],
    nickname: "訪客",
    bio: "登入後解鎖更多功能",
    isVVIP: false,
  };

  // Mock verified events
  const verifiedEvents = mockEvents.slice(0, 2);

  // Music DNA data
  const musicDNA = [
    { label: "舞曲性", value: 0.72, color: "#FF5252" },
    { label: "能量", value: 0.85, color: "#FF9800" },
    { label: "正向度", value: 0.65, color: "#4CAF50" },
    { label: "原聲", value: 0.45, color: "#2196F3" },
    { label: "器樂", value: 0.30, color: "#9C27B0" },
  ];

  const handleConnectSpotify = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Simulate Spotify connection
    setSpotifyConnected(true);
    if (Platform.OS === "web") {
      alert("Spotify 連結成功！音樂基因圖已更新");
    } else {
      Alert.alert("成功", "Spotify 連結成功！音樂基因圖已更新");
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View className="px-6 pt-6 pb-6 items-center">
          <Image
            source={{ uri: currentUser.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />

          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-2xl font-bold text-foreground">
              {currentUser.nickname}
            </Text>
            {currentUser.isVVIP && (
              <View className="bg-success/10 px-3 py-1 rounded-full border border-success/30">
                <Text className="text-xs font-semibold text-success">VVIP</Text>
              </View>
            )}
          </View>

          <Text className="text-base text-muted mb-3">
            {currentUser.age} 歲 · {currentUser.gender === "female" ? "女" : "男"}
          </Text>

          <Text className="text-sm text-muted text-center leading-relaxed">
            {currentUser.bio}
          </Text>

          <TouchableOpacity className="mt-4 bg-surface px-6 py-2 rounded-full border border-border active:opacity-80">
            <Text className="text-sm font-semibold text-foreground">編輯資料</Text>
          </TouchableOpacity>
        </View>

        {/* Music DNA */}
        <View className="px-6 pb-6">
          <View className="bg-primary rounded-2xl p-6 overflow-hidden">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-white">🎵 音樂基因圖</Text>
              {spotifyConnected && (
                <View className="bg-white/20 px-2 py-1 rounded-full">
                  <Text className="text-xs text-white">已同步</Text>
                </View>
              )}
            </View>

            {/* Top Artists */}
            <View className="mb-4">
              <Text className="text-sm text-white/80 mb-2">最喜歡的藝人</Text>
              <View className="flex-row flex-wrap gap-2">
                {currentUser.topArtists.map((artist, index) => (
                  <View key={index} className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-sm font-semibold text-white">{artist}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Audio Features Bars */}
            <View className="gap-3 mb-4">
              {musicDNA.map((feature) => (
                <View key={feature.label}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xs text-white/80">{feature.label}</Text>
                    <Text className="text-xs text-white/60">{Math.round(feature.value * 100)}%</Text>
                  </View>
                  <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${feature.value * 100}%`,
                        backgroundColor: feature.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Spotify Connect */}
            <TouchableOpacity
              onPress={handleConnectSpotify}
              className="bg-white/20 px-4 py-3 rounded-xl flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">🎶</Text>
                <Text className="text-sm font-semibold text-white">
                  {spotifyConnected ? "Spotify 已連結" : "連結 Spotify"}
                </Text>
              </View>
              <Text className="text-white/60">
                {spotifyConnected ? "✓" : "›"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ticket Wallet */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">🎫 我的票夾</Text>
            <Text className="text-sm text-muted">{verifiedEvents.length} 張票根</Text>
          </View>

          {verifiedEvents.length > 0 ? (
            <View className="gap-3">
              {verifiedEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  className="bg-surface rounded-2xl overflow-hidden border border-border active:opacity-80"
                  onPress={() => router.push(`/event/${event.id}`)}
                >
                  <Image
                    source={{ uri: event.coverImage }}
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                  <View className="p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-bold text-foreground flex-1" numberOfLines={1}>
                        {event.name}
                      </Text>
                      <View className="bg-success/10 px-3 py-1 rounded-full ml-2">
                        <Text className="text-xs font-semibold text-success">✅ 已驗證</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Add Ticket Button */}
              <TouchableOpacity
                onPress={() => router.push("/ticket-verify/1")}
                className="bg-surface rounded-2xl p-4 border border-dashed border-border items-center active:opacity-80"
              >
                <Text className="text-base text-muted">+ 驗證新票根</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center">
              <Text className="text-4xl mb-3">🎫</Text>
              <Text className="text-base font-bold text-foreground mb-2">還沒有票根</Text>
              <Text className="text-sm text-muted text-center mb-4">
                上傳票根驗證解鎖 VVIP 功能
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/ticket-verify/1")}
                className="bg-primary px-6 py-3 rounded-full active:opacity-80"
              >
                <Text className="text-white font-bold">上傳票根</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Settings */}
        <View className="px-6 pb-6">
          <Text className="text-xl font-bold text-foreground mb-4">⚙️ 設定</Text>

          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {[
              { label: "帳號設定", icon: "👤" },
              { label: "隱私設定", icon: "🔒" },
              { label: "通知設定", icon: "🔔" },
              { label: "外觀設定", icon: "🎨" },
              { label: "關於 / 幫助", icon: "ℹ️" },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center justify-between px-4 py-4 ${
                  index < arr.length - 1 ? "border-b border-border" : ""
                } active:opacity-80`}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-base">{item.icon}</Text>
                  <Text className="text-base text-foreground">{item.label}</Text>
                </View>
                <Text className="text-muted">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auth Actions */}
        <View className="px-6 pb-6">
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                Alert.alert("登出", "確定要登出嗎？", [
                  { text: "取消", style: "cancel" },
                  {
                    text: "登出",
                    style: "destructive",
                    onPress: async () => {
                      await logout();
                      router.replace("/auth/login" as any);
                    },
                  },
                ]);
              }}
              className="bg-error/10 py-4 rounded-2xl items-center border border-error/30"
            >
              <Text className="text-error font-bold text-base">登出帳號</Text>
            </TouchableOpacity>
          ) : (
            <View className="gap-3">
              <TouchableOpacity
onPress={() => router.push("/auth/login" as any)}
                className="bg-primary py-4 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-base">登入</Text>
              </TouchableOpacity>
              <TouchableOpacity
onPress={() => router.push("/auth/signup" as any)}
                className="bg-surface py-4 rounded-2xl items-center border border-border"
              >
                <Text className="text-foreground font-bold text-base">建立新帳號</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
