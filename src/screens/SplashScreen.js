import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { useThemeSafe } from "../utils/themeHelper";

export default function SplashScreen({ navigation }) {
  const { colors, isDark } = useThemeSafe();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Chuyển sang Login sau 3s
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
      {/* Background gradient + texture */}
      <Image
        source={require("../../assets/background-gradient.png")}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* Overlay tối + hiệu ứng blur nhẹ */}
      <View className="absolute inset-0" style={{ backgroundColor: colors.isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)" }} />

      <Animated.View
        style={{ opacity: fadeAnim }}
        className="items-center justify-center"
      >
        {/* Logo nổi bật với shadow */}
        <View className="rounded-full p-4 shadow-2xl" style={{ backgroundColor: colors.card }}>
          <Image
            source={require("../../assets/logo_bingbong.png")}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        {/* Text hiện đại */}
        <Text 
          className="text-xl font-bold mt-6 tracking-widest" 
          style={{ color: isDark ? colors.text : '#EC4899' }}
        >
          BingBong
        </Text>
        <Text 
          className="text-sm mt-1" 
          style={{ color: isDark ? colors.textSecondary : '#FFFFFF' }}
        >
          Social network connecting everyone
        </Text>
      </Animated.View>
    </View>
  );
}
