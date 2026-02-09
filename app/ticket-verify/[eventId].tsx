import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockEvents } from "@/lib/mock-data";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type VerifyStatus = "idle" | "uploading" | "verifying" | "success" | "failed";

/**
 * 票根驗證頁面
 * 上傳票根照片 → 驗證中 → 成功/失敗
 */
export default function TicketVerifyScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const colors = useColors();
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [ticketNumber, setTicketNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Animation values
  const successScale = useRef(new RNAnimated.Value(0)).current;
  const successOpacity = useRef(new RNAnimated.Value(0)).current;
  const failShake = useRef(new RNAnimated.Value(0)).current;

  const event = mockEvents.find((e) => e.id === Number(eventId));

  const handleSelectImage = () => {
    // Simulate image selection
    setSelectedImage("https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setStatus("uploading");

    // Simulate upload
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("verifying");

    // Simulate verification
    await new Promise((r) => setTimeout(r, 2000));

    // Simulate success (80% chance)
    const isSuccess = Math.random() > 0.2;
    if (isSuccess) {
      setStatus("success");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // Success animation
      RNAnimated.parallel([
        RNAnimated.spring(successScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        RNAnimated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setStatus("failed");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      // Shake animation
      RNAnimated.sequence([
        RNAnimated.timing(failShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(failShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(failShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(failShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(failShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setSelectedImage(null);
    setTicketNumber("");
    setOrderNumber("");
    successScale.setValue(0);
    successOpacity.setValue(0);
  };

  if (!event) {
    return (
      <ScreenContainer className="p-6">
        <Text className="text-foreground">活動不存在</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">票根驗證</Text>
        </View>

        {/* Event Info */}
        <View className="px-6 pb-4">
          <View className="bg-surface rounded-2xl p-4 border border-border flex-row items-center gap-4">
            <Image
              source={{ uri: event.coverImage }}
              className="w-16 h-16 rounded-xl"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                {event.name}
              </Text>
              <Text className="text-sm text-muted">{event.venue}</Text>
            </View>
          </View>
        </View>

        {/* Idle / Upload State */}
        {(status === "idle" || status === "uploading" || status === "verifying") && (
          <View className="px-6 gap-6 flex-1">
            {/* Image Upload Area */}
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">上傳票根照片</Text>
              <TouchableOpacity
                onPress={handleSelectImage}
                style={{
                  opacity: status !== "idle" ? 0.5 : 1,
                }}
                disabled={status !== "idle"}
              >
                {selectedImage ? (
                  <View className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary">
                    <Image
                      source={{ uri: selectedImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute top-2 right-2 bg-primary rounded-full px-3 py-1">
                      <Text className="text-xs font-semibold text-white">已選擇</Text>
                    </View>
                  </View>
                ) : (
                  <View className="w-full aspect-video rounded-2xl border-2 border-dashed border-border items-center justify-center bg-surface">
                    <Text className="text-4xl mb-2">📷</Text>
                    <Text className="text-base font-semibold text-foreground">點擊上傳票根照片</Text>
                    <Text className="text-sm text-muted mt-1">支援 JPG、PNG 格式</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Ticket Number (Optional) */}
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">票券資訊（選填）</Text>
              <View className="gap-3">
                <View className="bg-surface rounded-xl border border-border px-4 py-3">
                  <Text className="text-xs text-muted mb-1">票券編號</Text>
                  <TextInput
                    value={ticketNumber}
                    onChangeText={setTicketNumber}
                    placeholder="輸入票券編號"
                    placeholderTextColor={colors.muted}
                    className="text-base text-foreground"
                    editable={status === "idle"}
                    returnKeyType="done"
                  />
                </View>
                <View className="bg-surface rounded-xl border border-border px-4 py-3">
                  <Text className="text-xs text-muted mb-1">訂單編號</Text>
                  <TextInput
                    value={orderNumber}
                    onChangeText={setOrderNumber}
                    placeholder="輸入訂單編號"
                    placeholderTextColor={colors.muted}
                    className="text-base text-foreground"
                    editable={status === "idle"}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            {/* Submit Button */}
            {status === "idle" && (
              <TouchableOpacity
                onPress={handleSubmit}
                className={`py-4 rounded-full items-center ${selectedImage ? "bg-primary" : "bg-muted/30"}`}
                disabled={!selectedImage}
                style={{ opacity: selectedImage ? 1 : 0.5 }}
              >
                <Text className={`font-bold text-base ${selectedImage ? "text-white" : "text-muted"}`}>
                  提交驗證
                </Text>
              </TouchableOpacity>
            )}

            {/* Loading States */}
            {(status === "uploading" || status === "verifying") && (
              <View className="items-center py-8 gap-4">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-base font-semibold text-foreground">
                  {status === "uploading" ? "正在上傳票根..." : "正在驗證中..."}
                </Text>
                <Text className="text-sm text-muted text-center">
                  {status === "uploading"
                    ? "請稍候，正在上傳您的票根照片"
                    : "AI 正在比對您的票根資訊，請稍候"}
                </Text>
              </View>
            )}

            {/* Tips */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm font-bold text-foreground mb-2">驗證小提示</Text>
              <View className="gap-2">
                <Text className="text-xs text-muted">• 請確保票根照片清晰可辨識</Text>
                <Text className="text-xs text-muted">• 票根需包含活動名稱與票券編號</Text>
                <Text className="text-xs text-muted">• 每張票根僅能驗證一次</Text>
                <Text className="text-xs text-muted">• 驗證通過後將獲得 VVIP 徽章</Text>
              </View>
            </View>
          </View>
        )}

        {/* Success State */}
        {status === "success" && (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <RNAnimated.View
              style={{
                transform: [{ scale: successScale }],
                opacity: successOpacity,
                alignItems: "center",
              }}
            >
              <View className="w-24 h-24 rounded-full bg-success/20 items-center justify-center mb-6">
                <Text className="text-5xl">✅</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">驗證成功！</Text>
              <Text className="text-base text-muted text-center mb-2">
                恭喜你成為 VVIP
              </Text>

              {/* VVIP Badge */}
              <View className="bg-success/10 px-6 py-3 rounded-full mb-8 border-2 border-success">
                <Text className="text-lg font-bold text-success">VVIP</Text>
              </View>

              {/* Unlocked Features */}
              <View className="bg-surface rounded-2xl p-6 border border-border w-full gap-3 mb-8">
                <Text className="text-base font-bold text-foreground mb-2">已解鎖功能</Text>
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">♾️</Text>
                  <Text className="text-sm text-foreground">無限配對次數</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">👀</Text>
                  <Text className="text-sm text-foreground">查看「誰喜歡我」</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">✍️</Text>
                  <Text className="text-sm text-foreground">揪團發文與加入</Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="text-lg">🎵</Text>
                  <Text className="text-sm text-foreground">點歌破冰功能</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-primary px-8 py-4 rounded-full"
              >
                <Text className="text-white font-bold text-base">返回活動頁面</Text>
              </TouchableOpacity>
            </RNAnimated.View>
          </View>
        )}

        {/* Failed State */}
        {status === "failed" && (
          <RNAnimated.View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingVertical: 48,
              transform: [{ translateX: failShake }],
            }}
          >
            <View className="w-24 h-24 rounded-full bg-error/20 items-center justify-center mb-6">
              <Text className="text-5xl">❌</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">驗證失敗</Text>
            <Text className="text-base text-muted text-center mb-8">
              無法辨識您的票根，請確認照片清晰且包含完整票券資訊
            </Text>

            <View className="bg-surface rounded-2xl p-4 border border-border w-full mb-8">
              <Text className="text-sm font-bold text-foreground mb-2">可能的原因</Text>
              <View className="gap-2">
                <Text className="text-xs text-muted">• 照片模糊或光線不足</Text>
                <Text className="text-xs text-muted">• 票根資訊不完整</Text>
                <Text className="text-xs text-muted">• 票根已被其他帳號驗證</Text>
                <Text className="text-xs text-muted">• 票根與活動不符</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={handleRetry}
                className="bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-white font-bold">重新上傳</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-surface px-6 py-3 rounded-full border border-border"
              >
                <Text className="text-foreground font-bold">返回</Text>
              </TouchableOpacity>
            </View>
          </RNAnimated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
