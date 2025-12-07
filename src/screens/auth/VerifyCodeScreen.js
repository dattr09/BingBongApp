import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { verifyCode } from "../../services/authService";

export default function VerifyCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, action = "verifyAccount" } = route.params || {};

  const [code, setCode] = useState(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [timer, setTimer] = useState(300); // 5 phút = 300s

  const inputs = useRef([]);
  const animScale = useRef(code.map(() => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Timer đếm ngược
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Toast message
  const showToast = (message) => {
    setMsg(message);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text, index) => {
    if (isNaN(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Animate input
    Animated.sequence([
      Animated.timing(animScale[index], { toValue: 1.1, duration: 150, useNativeDriver: true }),
      Animated.timing(animScale[index], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (text && index < 5) inputs.current[index + 1].focus();
  };

  const handleBackspace = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (index > 0 && !code[index]) inputs.current[index - 1].focus();
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setTimer(300); // Reset 5 phút
      setCode(new Array(6).fill(""));
      showToast("✅ Mã xác thực mới đã được gửi.");
    } catch (err) {
      showToast("❌ Không thể gửi lại mã. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async () => {
    const combinedCode = code.join("");
    if (combinedCode.length !== 6) {
      showToast("❌ Vui lòng nhập đủ 6 số.");
      return;
    }
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      await verifyCode(email, combinedCode, action);
      setIsLoading(false);
      
      if (action === "resetPassword") {
        showToast("✅ Mã xác thực thành công!");
        setTimeout(() => {
          navigation.navigate("ChangePassword", { email });
        }, 1000);
      } else {
        showToast("Tài khoản đã được xác thực!");
        setTimeout(() => {
          navigation.popToTop();
          navigation.replace("Login");
        }, 1000);
      }
    } catch (err) {
      setIsLoading(false);
      showToast(err.response?.data?.message || "❌ Mã xác thực không đúng.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#EEF3FF]">
      {/* Toast message */}
      {msg !== "" && (
        <Animated.View
          className={`absolute top-5 px-5 py-2 rounded-xl z-50 self-center ${msg.includes("✅") ? "bg-green-400" : "bg-red-400"
            }`}
          style={{ opacity: fadeAnim }}
        >
          <Text className="text-white font-medium">{msg}</Text>
        </Animated.View>
      )}

      <View className="flex-1 items-center justify-center p-6">
        {/* Logo */}
        <Image
          source={require("../../../assets/logo_bingbong.png")}
          className="w-32 h-32 mb-2"
        />

        {/* Card Form với pd=2 */}
        <View className="w-full bg-white p-4 py-6 rounded-3xl shadow-xl">
          <Text className="text-2xl font-bold text-indigo-700 text-center mb-4">
            {action === "resetPassword" ? "Xác thực đặt lại mật khẩu" : "Xác thực tài khoản"}
          </Text>
          <Text className="text-center text-gray-600 mb-4">
            Chúng tôi đã gửi mã 6 số đến{"\n"}
            <Text className="font-semibold text-gray-800">{email}</Text>
          </Text>

          {/* Code Inputs */}
          <View className="flex-row justify-center mb-4">
            {code.map((_, index) => (
              <Animated.View
                key={index}
                className="mx-2"
                style={{ transform: [{ scale: animScale[index] }] }}
              >
                <TextInput
                  ref={(el) => (inputs.current[index] = el)}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={code[index]}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleBackspace(e, index)}
                  className={`w-14 h-16 border-2 rounded-xl text-center text-2xl font-bold ${code[index] ? "border-indigo-500 bg-indigo-100" : "border-gray-300 bg-white"
                    }`}
                />
              </Animated.View>
            ))}
          </View>

          {/* Timer */}
          <Text
            className={`text-center font-medium mb-4 ${timer <= 30 ? "text-red-500" : "text-gray-600"
              }`}
          >
            {timer > 0
              ? `Mã còn hiệu lực: ${timer}s`
              : "Mã đã hết hạn, vui lòng gửi lại mã."}
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="w-full bg-indigo-600 py-3 rounded-xl items-center mb-2"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Xác nhận</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View className="flex-row justify-center items-center mb-2">
            <Text className="text-gray-600 mr-2">Không nhận được mã?</Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
              <Text className={`font-bold ${timer > 0 ? "text-gray-400" : "text-indigo-600"}`}>
                {timer > 0 ? `Gửi lại sau ${timer}s` : "Gửi lại mã"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
