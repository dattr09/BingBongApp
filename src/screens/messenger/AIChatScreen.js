import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import MessengerHeader from "../../components/MessengerHeader";
import MessengerNavbar from "../../components/MessengerNavbar";

export default function AIChatScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <MessengerHeader />

      <View className="flex-1 items-center justify-center px-6">
        <View
          className="h-24 w-24 rounded-full items-center justify-center mb-6"
          style={{
            backgroundColor: colors.primary + "20",
            borderWidth: 2,
            borderColor: colors.primary + "30",
          }}
        >
          <Text style={{ fontSize: 48 }}>🤖</Text>
        </View>

        <Text
          className="text-2xl font-bold mb-2"
          style={{ color: colors.text }}
        >
          BingBong AI
        </Text>

        <Text
          className="text-base text-center mb-8"
          style={{ color: colors.textSecondary }}
        >
          Your AI assistant is ready to help!
        </Text>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Chat", {
              aiChat: {
                _id: "bingbong-ai",
                avatar: "bingbong-ai",
                fullName: "BingBong AI",
                name: "BingBong AI",
              },
              chatType: "AI",
            });
          }}
          className="px-8 py-4 rounded-full"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold" style={{ color: "#fff" }}>
            Start Chatting
          </Text>
        </TouchableOpacity>
      </View>
      <MessengerNavbar />
    </SafeAreaView>
  );
}

