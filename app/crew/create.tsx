import { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { mockEvents } from "@/lib/mock-data";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

type CrewType = "transport" | "accommodation" | "onsite" | "ticket";

interface CrewTemplate {
  type: CrewType;
  emoji: string;
  label: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; multiline?: boolean }[];
}

const CREW_TEMPLATES: CrewTemplate[] = [
  {
    type: "transport",
    emoji: "🚗",
    label: "交通共乘",
    color: "#FF5252",
    fields: [
      { key: "origin", label: "出發地", placeholder: "例：台北車站" },
      { key: "destination", label: "目的地", placeholder: "例：高雄駁二" },
      { key: "departureTime", label: "出發時間", placeholder: "例：3/28 早上 8:00" },
    ],
  },
  {
    type: "accommodation",
    emoji: "🏨",
    label: "住宿分攤",
    color: "#2196F3",
    fields: [
      { key: "location", label: "住宿地點", placeholder: "例：高雄市區民宿" },
      { key: "checkInDate", label: "入住日期", placeholder: "例：3/27" },
      { key: "checkOutDate", label: "退房日期", placeholder: "例：3/30" },
      { key: "roomType", label: "房型", placeholder: "例：四人房" },
    ],
  },
  {
    type: "onsite",
    emoji: "🎤",
    label: "現場揪人",
    color: "#00D9A3",
    fields: [
      { key: "meetTime", label: "集合時間", placeholder: "例：下午 2:00" },
      { key: "meetLocation", label: "集合地點", placeholder: "例：主舞台前方" },
      { key: "purpose", label: "目的", placeholder: "例：一起看草東、互拍照片" },
    ],
  },
  {
    type: "ticket",
    emoji: "🎫",
    label: "票券交易",
    color: "#FFC107",
    fields: [
      { key: "ticketType", label: "票種", placeholder: "例：兩日票" },
      { key: "quantity", label: "數量", placeholder: "例：1" },
      { key: "price", label: "價格", placeholder: "例：原價 $3,600" },
      { key: "tradeMethod", label: "交易方式", placeholder: "例：面交或郵寄" },
    ],
  },
];

export default function CreateCrewScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const colors = useColors();

  const [step, setStep] = useState<"type" | "details" | "confirm">("type");
  const [selectedType, setSelectedType] = useState<CrewType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("4");
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});

  const event = mockEvents.find((e) => e.id === Number(eventId));
  const selectedTemplate = CREW_TEMPLATES.find((t) => t.type === selectedType);

  const handleSelectType = (type: CrewType) => {
    setSelectedType(type);
    setStep("details");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setTemplateFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (!title.trim()) {
      if (Platform.OS === "web") {
        alert("請輸入揪團標題");
      } else {
        Alert.alert("提示", "請輸入揪團標題");
      }
      return;
    }
    setStep("confirm");
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // In real app, this would call the API
    if (Platform.OS === "web") {
      alert("揪團已發起！");
    } else {
      Alert.alert("成功", "揪團已發起！", [{ text: "確定", onPress: () => router.back() }]);
    }
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
      {/* Header */}
      <View className="px-6 pt-4 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              if (step === "details") setStep("type");
              else if (step === "confirm") setStep("details");
              else router.back();
            }}
          >
            <Text className="text-2xl text-foreground">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-4">發起揪團</Text>
        </View>
        <Text className="text-sm text-muted">
          {step === "type" ? "1/3" : step === "details" ? "2/3" : "3/3"}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="px-6 pb-4">
        <View className="h-1 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{
              width: step === "type" ? "33%" : step === "details" ? "66%" : "100%",
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Step 1: Select Type */}
        {step === "type" && (
          <View className="px-6 gap-4">
            <Text className="text-lg font-bold text-foreground">選擇揪團類型</Text>
            <Text className="text-sm text-muted mb-2">
              為「{event.name}」選擇一個揪團類型
            </Text>

            {CREW_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.type}
                onPress={() => handleSelectType(template.type)}
                className="bg-surface rounded-2xl p-5 border border-border active:opacity-80"
              >
                <View className="flex-row items-center gap-4">
                  <View
                    className="w-14 h-14 rounded-xl items-center justify-center"
                    style={{ backgroundColor: template.color + "20" }}
                  >
                    <Text className="text-2xl">{template.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{template.label}</Text>
                    <Text className="text-sm text-muted mt-1">
                      {template.type === "transport" && "共乘前往活動現場"}
                      {template.type === "accommodation" && "分攤住宿費用"}
                      {template.type === "onsite" && "現場找同好一起看"}
                      {template.type === "ticket" && "票券轉讓或徵求"}
                    </Text>
                  </View>
                  <Text className="text-muted text-lg">›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Fill Details */}
        {step === "details" && selectedTemplate && (
          <View className="px-6 gap-5">
            <View className="flex-row items-center gap-3 mb-2">
              <View
                className="w-10 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: selectedTemplate.color + "20" }}
              >
                <Text className="text-lg">{selectedTemplate.emoji}</Text>
              </View>
              <Text className="text-lg font-bold text-foreground">{selectedTemplate.label}</Text>
            </View>

            {/* Title */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">揪團標題 *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="輸入吸引人的標題"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                returnKeyType="done"
              />
            </View>

            {/* Description */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">詳細說明</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="描述你的揪團計畫..."
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            {/* Max Members */}
            <View className="bg-surface rounded-xl border border-border px-4 py-3">
              <Text className="text-xs text-muted mb-1">人數上限</Text>
              <TextInput
                value={maxMembers}
                onChangeText={setMaxMembers}
                placeholder="4"
                placeholderTextColor={colors.muted}
                className="text-base text-foreground"
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>

            {/* Template-specific fields */}
            <Text className="text-base font-bold text-foreground mt-2">
              {selectedTemplate.label}詳情
            </Text>
            {selectedTemplate.fields.map((field) => (
              <View key={field.key} className="bg-surface rounded-xl border border-border px-4 py-3">
                <Text className="text-xs text-muted mb-1">{field.label}</Text>
                <TextInput
                  value={templateFields[field.key] || ""}
                  onChangeText={(v) => handleFieldChange(field.key, v)}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  className="text-base text-foreground"
                  multiline={field.multiline}
                  returnKeyType="done"
                />
              </View>
            ))}

            {/* Next Button */}
            <TouchableOpacity
              onPress={handleNext}
              className="bg-primary py-4 rounded-full items-center mt-4"
            >
              <Text className="text-white font-bold text-base">下一步</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedTemplate && (
          <View className="px-6 gap-5">
            <Text className="text-lg font-bold text-foreground">確認揪團資訊</Text>

            <View className="bg-surface rounded-2xl p-5 border border-border gap-4">
              {/* Type Badge */}
              <View className="flex-row items-center gap-2">
                <Text className="text-lg">{selectedTemplate.emoji}</Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: selectedTemplate.color + "20" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: selectedTemplate.color }}>
                    {selectedTemplate.label}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <View>
                <Text className="text-xs text-muted">標題</Text>
                <Text className="text-base font-bold text-foreground mt-1">{title}</Text>
              </View>

              {/* Description */}
              {description ? (
                <View>
                  <Text className="text-xs text-muted">說明</Text>
                  <Text className="text-sm text-foreground mt-1">{description}</Text>
                </View>
              ) : null}

              {/* Max Members */}
              <View>
                <Text className="text-xs text-muted">人數上限</Text>
                <Text className="text-sm text-foreground mt-1">{maxMembers} 人</Text>
              </View>

              {/* Template Fields */}
              {selectedTemplate.fields.map((field) =>
                templateFields[field.key] ? (
                  <View key={field.key}>
                    <Text className="text-xs text-muted">{field.label}</Text>
                    <Text className="text-sm text-foreground mt-1">
                      {templateFields[field.key]}
                    </Text>
                  </View>
                ) : null,
              )}

              {/* Event */}
              <View>
                <Text className="text-xs text-muted">活動</Text>
                <Text className="text-sm text-foreground mt-1">{event?.name}</Text>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-primary py-4 rounded-full items-center"
            >
              <Text className="text-white font-bold text-base">確認發起揪團</Text>
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              onPress={() => setStep("details")}
              className="py-3 items-center"
            >
              <Text className="text-sm text-muted">返回修改</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
