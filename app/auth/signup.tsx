import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

type SignupStep = "basic" | "location" | "preferences" | "confirm";

interface SignupData {
  nickname: string;
  email: string;
  password: string;
  gender: "male" | "female" | "other";
  age: string;
  bio: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  musicGenres: string[];
}

const MUSIC_GENRES = [
  "搖滾",
  "嘻哈",
  "電子",
  "民謠",
  "爵士",
  "古典",
  "流行",
  "獨立",
  "龐克",
  "金屬",
  "雷鬼",
  "靈魂樂",
];

/**
 * 多步驟註冊流程
 * 1. 基本資料 (暱稱、郵件、密碼、性別、年齡)
 * 2. 位置授權 (獲取用戶位置)
 * 3. 音樂偏好 (選擇喜歡的音樂類型)
 * 4. 確認 (審視所有資料)
 */
export default function SignupScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signup } = useAuthContext();

  const [step, setStep] = useState<SignupStep>("basic");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [data, setData] = useState<SignupData>({
    nickname: "",
    email: "",
    password: "",
    gender: "other",
    age: "",
    bio: "",
    musicGenres: [],
  });

  const handleBasicNext = () => {
    if (!data.nickname.trim()) {
      Alert.alert("提示", "請輸入暱稱");
      return;
    }
    if (!data.email.trim() || !data.email.includes("@")) {
      Alert.alert("提示", "請輸入有效的郵件地址");
      return;
    }
    if (!data.password || data.password.length < 6) {
      Alert.alert("提示", "密碼至少需要 6 個字符");
      return;
    }
    if (!data.age || parseInt(data.age) < 13) {
      Alert.alert("提示", "年齡必須至少 13 歲");
      return;
    }

    setStep("location");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRequestLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("位置權限", "位置權限被拒絕,您可以稍後在設定中啟用");
        setStep("preferences");
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Get city name from coordinates
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setData((prev) => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: geocode[0]?.city || geocode[0]?.region || "未知位置",
      }));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setStep("preferences");
    } catch (error) {
      console.error("位置獲取失敗:", error);
      Alert.alert("錯誤", "無法獲取位置,請檢查位置服務是否啟用");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSkipLocation = () => {
    setStep("preferences");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setData((prev) => ({
      ...prev,
      musicGenres: prev.musicGenres.includes(genre)
        ? prev.musicGenres.filter((g) => g !== genre)
        : [...prev.musicGenres, genre],
    }));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePreferencesNext = () => {
    if (data.musicGenres.length === 0) {
      Alert.alert("提示", "請至少選擇一個音樂類型");
      return;
    }
    setStep("confirm");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        displayName: data.nickname,
        gender: data.gender as "male" | "female" | "other" | "prefer_not_to_say",
        location: data.latitude ? {
          latitude: data.latitude,
          longitude: data.longitude!,
          city: data.city,
        } : undefined,
        musicGenres: data.musicGenres,
      });

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("成功", "帳號註冊成功!", [
          { text: "確定", onPress: () => router.replace("/(tabs)") },
        ]);
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("註冊失敗", result.error || "請稍後重試");
      }
    } catch (error: any) {
      Alert.alert("錯誤", error?.message || "註冊失敗,請稍後重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center">
            {step !== "basic" && (
              <TouchableOpacity
                onPress={() => {
                  if (step === "location") setStep("basic");
                  else if (step === "preferences") setStep("location");
                  else if (step === "confirm") setStep("preferences");
                }}
              >
                <Text className="text-2xl text-foreground">←</Text>
              </TouchableOpacity>
            )}
            <Text className="text-2xl font-bold text-foreground ml-4">
              {step === "basic" && "建立帳號"}
              {step === "location" && "位置設定"}
              {step === "preferences" && "音樂偏好"}
              {step === "confirm" && "確認資訊"}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="px-6 pb-4">
          <View className="h-1 bg-border rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width:
                  step === "basic"
                    ? "25%"
                    : step === "location"
                      ? "50%"
                      : step === "preferences"
                        ? "75%"
                        : "100%",
              }}
            />
          </View>
          <Text className="text-xs text-muted mt-2">
            {step === "basic" && "第 1 步 / 4"}
            {step === "location" && "第 2 步 / 4"}
            {step === "preferences" && "第 3 步 / 4"}
            {step === "confirm" && "第 4 步 / 4"}
          </Text>
        </View>

        {/* Step 1: Basic Info */}
        {step === "basic" && (
          <View className="px-6 gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">基本資料</Text>

            {/* Nickname */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">暱稱 *</Text>
              <TextInput
                value={data.nickname}
                onChangeText={(v) => setData({ ...data, nickname: v })}
                placeholder="輸入您的暱稱"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                returnKeyType="done"
              />
            </View>

            {/* Email */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">郵件地址 *</Text>
              <TextInput
                value={data.email}
                onChangeText={(v) => setData({ ...data, email: v })}
                placeholder="輸入郵件地址"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                keyboardType="email-address"
                returnKeyType="done"
              />
            </View>

            {/* Password */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">密碼 *</Text>
              <TextInput
                value={data.password}
                onChangeText={(v) => setData({ ...data, password: v })}
                placeholder="輸入密碼 (至少 6 個字符)"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                secureTextEntry
                returnKeyType="done"
              />
            </View>

            {/* Gender & Age */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-xl border border-border px-4 py-3">
                <Text className="text-xs text-muted mb-2">性別</Text>
                <View className="flex-row gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setData({ ...data, gender: g })}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        data.gender === g ? "bg-primary" : "bg-background"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          data.gender === g ? "text-white" : "text-foreground"
                        }`}
                      >
                        {g === "male" ? "男" : g === "female" ? "女" : "其他"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-1 bg-surface rounded-xl border border-border px-4 py-3">
                <Text className="text-xs text-muted mb-1">年齡 *</Text>
                <TextInput
                  value={data.age}
                  onChangeText={(v) => setData({ ...data, age: v })}
                  placeholder="18"
                  placeholderTextColor={colors.muted}
                  className="text-base text-foreground"
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Bio */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">個人簡介</Text>
              <TextInput
                value={data.bio}
                onChangeText={(v) => setData({ ...data, bio: v })}
                placeholder="介紹一下自己..."
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Next Button */}
            <TouchableOpacity
              onPress={handleBasicNext}
              className="bg-primary py-4 rounded-full items-center mt-4"
            >
              <Text className="text-white font-bold text-base">下一步</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Location */}
        {step === "location" && (
          <View className="px-6 gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">位置設定</Text>

            <View className="bg-primary/10 rounded-2xl p-6 border border-primary/30 items-center">
              <Text className="text-5xl mb-4">📍</Text>
              <Text className="text-base font-bold text-foreground text-center mb-2">
                啟用位置服務
              </Text>
              <Text className="text-sm text-muted text-center mb-6">
                我們會使用您的位置來顯示附近的活動和配對建議
              </Text>

              {locationLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleRequestLocation}
                    className="bg-primary px-8 py-4 rounded-full mb-3 w-full items-center"
                  >
                    <Text className="text-white font-bold text-base">
                      📍 允許位置存取
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSkipLocation}
                    className="bg-surface px-8 py-4 rounded-full w-full items-center border border-border"
                  >
                    <Text className="text-foreground font-bold text-base">
                      稍後設定
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {data.city && (
              <View className="bg-success/10 rounded-xl p-4 border border-success/30">
                <Text className="text-sm text-success font-semibold">
                  ✓ 已獲取位置: {data.city}
                </Text>
              </View>
            )}

            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm font-bold text-foreground mb-2">隱私保護</Text>
              <Text className="text-xs text-muted leading-relaxed">
                您的位置資訊僅用於顯示附近活動。我們不會將您的精確位置分享給其他用戶,只會顯示大致區域。
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Music Preferences */}
        {step === "preferences" && (
          <View className="px-6 gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">
              選擇喜歡的音樂類型
            </Text>
            <Text className="text-sm text-muted mb-2">
              這將幫助我們為您推薦更合適的活動和配對對象
            </Text>

            <View className="gap-2">
              {MUSIC_GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  onPress={() => handleGenreToggle(genre)}
                  className={`rounded-xl p-4 border ${
                    data.musicGenres.includes(genre)
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base font-semibold ${
                        data.musicGenres.includes(genre)
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {genre}
                    </Text>
                    {data.musicGenres.includes(genre) && (
                      <View className="bg-primary rounded-full w-6 h-6 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handlePreferencesNext}
              className="bg-primary py-4 rounded-full items-center mt-4"
            >
              <Text className="text-white font-bold text-base">下一步</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <View className="px-6 gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">確認註冊資訊</Text>

            <View className="bg-surface rounded-2xl p-5 border border-border gap-4">
              {/* Basic Info */}
              <View>
                <Text className="text-xs text-muted mb-1">暱稱</Text>
                <Text className="text-base font-bold text-foreground">{data.nickname}</Text>
              </View>

              <View className="h-px bg-border" />

              <View>
                <Text className="text-xs text-muted mb-1">郵件</Text>
                <Text className="text-base font-bold text-foreground">{data.email}</Text>
              </View>

              <View className="h-px bg-border" />

              <View>
                <Text className="text-xs text-muted mb-1">性別 · 年齡</Text>
                <Text className="text-base font-bold text-foreground">
                  {data.gender === "male" ? "男" : data.gender === "female" ? "女" : "其他"} ·{" "}
                  {data.age} 歲
                </Text>
              </View>

              {data.city && (
                <>
                  <View className="h-px bg-border" />
                  <View>
                    <Text className="text-xs text-muted mb-1">位置</Text>
                    <Text className="text-base font-bold text-foreground">{data.city}</Text>
                  </View>
                </>
              )}

              <View className="h-px bg-border" />

              <View>
                <Text className="text-xs text-muted mb-2">喜歡的音樂類型</Text>
                <View className="flex-row flex-wrap gap-2">
                  {data.musicGenres.map((genre) => (
                    <View
                      key={genre}
                      className="bg-primary/10 px-3 py-1 rounded-full border border-primary"
                    >
                      <Text className="text-xs font-semibold text-primary">{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Terms */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-xs text-muted leading-relaxed">
                點擊「完成註冊」即表示您同意我們的服務條款和隱私政策。
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className={`py-4 rounded-full items-center ${loading ? "bg-muted/30" : "bg-primary"}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text className="text-white font-bold text-base">完成註冊</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
