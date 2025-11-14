import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// Import hàm API của bạn
import { verifyCode } from "../../services/authService";
// (Bạn cũng nên có một hàm 'resendVerifyCode' trong service của mình)
// import { resendVerifyCode } from "../../services/authService";

export default function VerifyCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params; // Lấy email từ màn hình Password

  const [code, setCode] = useState(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);

  // Refs cho 6 ô input
  const inputs = useRef([]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Xử lý khi nhập mã
  const handleChange = (text, index) => {
    if (isNaN(text)) return; // Chỉ cho phép số

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Tự động chuyển sang ô tiếp theo
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  // Xử lý khi bấm xóa (Backspace)
  const handleBackspace = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      // Nếu ô hiện tại trống, focus ô trước đó
      if (index > 0 && !code[index]) {
        inputs.current[index - 1].focus();
      }
      const newCode = [...code];
      newCode[index] = ""; // Xóa ký tự ở ô hiện tại
      setCode(newCode);
    }
  };

  // Xử lý Gửi lại mã
  const handleResend = async () => {
    if (timer > 0) return; // Chỉ gửi lại khi hết giờ

    try {
      // (Gọi API gửi lại mã của bạn ở đây)
      // await resendVerifyCode(email);
      setTimer(60); // Reset đếm ngược
      setCode(new Array(6).fill("")); // Xóa mã cũ
      setError("");
      Alert.alert("Thành công", "Mã xác thực mới đã được gửi.");
    } catch (err) {
      setError("Không thể gửi lại mã. Vui lòng thử lại.");
    }
  };

  // Xử lý Xác nhận
  const handleSubmit = async () => {
    const combinedCode = code.join("");

    if (combinedCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số.");
      return;
    }

    setIsLoading(true);
    setError("");
    Keyboard.dismiss();

    try {
      const result = await verifyCode(email, combinedCode, "verifyAccount"); // Thêm action
      setIsLoading(false);
      Alert.alert("Thành công!", "Tài khoản của bạn đã được xác thực.");
      navigation.popToTop();
      navigation.replace("Login");
    } catch (err) {
      setIsLoading(false);
      console.error(err.response?.data); // Log lỗi từ backend
      setError(err.response?.data?.message || "Mã xác thực không đúng.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center p-6">
        {/* Nút quay lại (nếu cần) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-14 left-4 p-2 z-10"
        >
          <Ionicons name="arrow-back-outline" size={28} color="#333" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-center mb-2">
          Xác thực tài khoản
        </Text>
        <Text className="text-base text-gray-600 text-center mb-8">
          Chúng tôi đã gửi mã 6 số đến {"\n"}
          <Text className="font-semibold text-gray-800">{email}</Text>
        </Text>

        {/* 6 ô nhập mã */}
        <View className="flex-row justify-between mb-4">
          {code.map((_, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              className="w-12 h-14 border border-gray-300 rounded-lg text-center text-2xl font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleBackspace(e, index)}
              value={code[index]}
            />
          ))}
        </View>

        {/* Thông báo lỗi */}
        {error ? (
          <Text className="text-red-500 text-center mb-4">{error}</Text>
        ) : null}

        {/* Nút Xác nhận */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="bg-indigo-600 py-4 rounded-lg items-center mb-4"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Xác nhận</Text>
          )}
        </TouchableOpacity>

        {/* Gửi lại mã */}
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600">Không nhận được mã? </Text>
          <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
            <Text
              className={`font-bold ${
                timer > 0 ? "text-gray-400" : "text-indigo-600"
              }`}
            >
              {timer > 0 ? `Gửi lại sau ${timer}s` : "Gửi lại mã"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
