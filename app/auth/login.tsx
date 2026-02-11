import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";
import * as Haptics from "expo-haptics";

/**
 * 登入頁面
 * Email + 密碼登入
 */
export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("提示", "請輸入有效的郵件地址");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("提示", "密碼至少需要 6 個字符");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/(tabs)");
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("登入失敗", result.error || "帳號或密碼錯誤");
      }
    } catch (err: any) {
      Alert.alert("錯誤", err?.message || "登入失敗，請稍後重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 gap-6">
            {/* Logo & Title */}
            <View className="items-center mb-4">
              <Text className="text-5xl mb-4">🎵</Text>
              <Text className="text-3xl font-bold text-foreground">SoundCheck</Text>
              <Text className="text-base text-muted mt-2">音樂活動社交平台</Text>
            </View>

            {/* Login Form */}
            <View className="gap-4">
              {/* Email */}
              <View className="bg-surface rounded-xl border border-border px-4 py-3">
                <Text className="text-xs text-muted mb-1">郵件地址</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="輸入郵件地址"
                  placeholderTextColor={colors.muted}
                  className="text-base text-foreground"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View className="bg-surface rounded-xl border border-border px-4 py-3">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-xs text-muted">密碼</Text>
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Text className="text-xs text-primary">
                      {showPassword ? "隱藏" : "顯示"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="輸入密碼"
                  placeholderTextColor={colors.muted}
                  className="text-base text-foreground"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`py-4 rounded-full items-center ${loading ? "bg-muted/30" : "bg-primary"}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text className="text-white font-bold text-base">登入</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center gap-4">
              <View className="flex-1 h-px bg-border" />
              <Text className="text-xs text-muted">或</Text>
              <View className="flex-1 h-px bg-border" />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              onPress={() => router.push("/auth/signup")}
              className="bg-surface py-4 rounded-full items-center border border-border"
            >
              <Text className="text-foreground font-bold text-base">建立新帳號</Text>
            </TouchableOpacity>

            {/* Skip / Guest Mode */}
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="py-3 items-center"
            >
              <Text className="text-muted text-sm">先逛逛再說</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
