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
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        Alert.alert("Thành công", "Đã gửi mã xác nhận đến email của bạn");
        navigation.navigate("VerifyCode", {
          email,
          action: "resetPassword",
        });
      } else {
        Alert.alert("Lỗi", res.message || "Không thể gửi email");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white items-center justify-center px-6">
      <View className="w-full max-w-md">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="key-outline" size={40} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Quên mật khẩu
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu
          </Text>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-lg">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3 px-3 text-gray-900"
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`bg-blue-600 rounded-lg py-3 items-center ${
              loading ? "opacity-50" : ""
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white font-semibold">
              {loading ? "Đang gửi..." : "Gửi mã xác nhận"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 items-center"
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-blue-600 text-sm">
              Nhớ mật khẩu? Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

