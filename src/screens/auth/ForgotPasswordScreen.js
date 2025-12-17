import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter email");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        Alert.alert("Success", "Verification code has been sent to your email");
        navigation.navigate("VerifyCode", {
          email,
          action: "resetPassword",
        });
      } else {
        Alert.alert("Error", res.message || "Unable to send email");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
      <View className="w-full max-w-md">
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: colors.primary + '20' }}>
            <Ionicons name="key-outline" size={40} color={colors.primary} />
          </View>
          <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            Forgot Password
          </Text>
          <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
            Enter your email to receive a password reset code
          </Text>
        </View>

        <View className="rounded-xl p-6 shadow-lg" style={{ backgroundColor: colors.card }}>
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Email
            </Text>
            <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} />
              <TextInput
                className="flex-1 py-3 px-3"
                style={{ color: colors.text }}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`rounded-lg py-3 items-center ${loading ? "opacity-50" : ""
              }`}
            style={{ backgroundColor: colors.primary }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-semibold">
              {loading ? "Sending..." : "Send Verification Code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-sm" style={{ color: colors.primary }}>
              Remember password? Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

