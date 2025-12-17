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
import { useThemeSafe } from "../../utils/themeHelper";
import { verifyCode } from "../../services/authService";

export default function VerifyCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const { email, action = "verifyAccount" } = route.params || {};

  const [code, setCode] = useState(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [timer, setTimer] = useState(300);
  const inputs = useRef([]);
  const animScale = useRef(code.map(() => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);
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
      setTimer(300);
      setCode(new Array(6).fill(""));
      showToast("✅ New verification code has been sent.");
    } catch (err) {
      showToast("❌ Unable to resend code. Please try again.");
    }
  };

  const handleSubmit = async () => {
    const combinedCode = code.join("");
    if (combinedCode.length !== 6) {
      showToast("❌ Please enter all 6 digits.");
      return;
    }
    setIsLoading(true);
    Keyboard.dismiss();
    try {
      await verifyCode(email, combinedCode, action);
      setIsLoading(false);
      
      if (action === "resetPassword") {
        showToast("✅ Verification successful!");
        setTimeout(() => {
          navigation.navigate("ChangePassword", { email });
        }, 1000);
      } else {
        showToast("Account has been verified!");
        setTimeout(() => {
          navigation.popToTop();
          navigation.replace("Login");
        }, 1000);
      }
    } catch (err) {
      setIsLoading(false);
      showToast(err.response?.data?.message || "❌ Verification code is incorrect.");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Toast message */}
      {msg !== "" && (
        <Animated.View
          className="absolute top-5 px-5 py-2 rounded-xl z-50 self-center"
          style={{ 
            opacity: fadeAnim,
            backgroundColor: msg.includes("✅") ? colors.success : colors.error
          }}
        >
          <Text className="text-white font-medium">{msg}</Text>
        </Animated.View>
      )}

      <View className="flex-1 items-center justify-center">
        <Image
          source={require("../../../assets/logo_bingbong.png")}
          className="w-32 h-32 mb-2"
        />

        {/* Card Form với pd=2 */}
        <View className="w-full p-4 py-6 rounded-3xl shadow-xl" style={{ backgroundColor: colors.card }}>
          <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.primary }}>
            {action === "resetPassword" ? "Verify Password Reset" : "Verify Account"}
          </Text>
          <Text className="text-center mb-4" style={{ color: colors.textSecondary }}>
            We have sent a 6-digit code to{"\n"}
            <Text className="font-semibold" style={{ color: colors.text }}>{email}</Text>
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
                  className="w-14 h-16 border-2 rounded-xl text-center text-2xl font-bold"
                  style={{
                    borderColor: code[index] ? colors.primary : colors.border,
                    backgroundColor: code[index] ? colors.primary + '15' : colors.surface,
                    color: colors.text
                  }}
                />
              </Animated.View>
            ))}
          </View>

          {/* Timer */}
          <Text
            className="text-center font-medium mb-4"
            style={{ color: timer <= 30 ? colors.error : colors.textSecondary }}
          >
            {timer > 0
              ? `Code expires in: ${timer}s`
              : "Code has expired, please resend code."}
          </Text>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 rounded-xl items-center mb-2"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View className="flex-row justify-center items-center mb-2">
            <Text className="mr-2" style={{ color: colors.textSecondary }}>Didn't receive code?</Text>
            <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
              <Text className="font-bold" style={{ color: timer > 0 ? colors.textTertiary : colors.primary }}>
                {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
