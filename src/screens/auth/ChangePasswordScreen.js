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
import { useNavigation, useRoute } from "@react-navigation/native";
import { resetPassword } from "../../services/authService";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu không khớp");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(email, password);
      if (res.success) {
        Alert.alert("Thành công", "Đặt lại mật khẩu thành công", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        Alert.alert("Lỗi", res.message || "Không thể đặt lại mật khẩu");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white items-center justify-center px-6">
      <View className="w-full max-w-md">
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="lock-closed-outline" size={40} color="#3B82F6" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Đặt lại mật khẩu
          </Text>
          <Text className="text-sm text-gray-600 text-center">
            Nhập mật khẩu mới của bạn
          </Text>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-lg">
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3 px-3 text-gray-900"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </Text>
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3 px-3 text-gray-900"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            className={`bg-blue-600 rounded-lg py-3 items-center ${
              loading ? "opacity-50" : ""
            }`}
            onPress={handleReset}
            disabled={loading}
          >
            <Text className="text-white font-semibold">
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

