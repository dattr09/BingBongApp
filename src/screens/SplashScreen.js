import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Chuyển sang Login sau 3s
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View className="flex-1 bg-black/50 justify-center items-center">
      {/* Background gradient + texture */}
      <Image
        source={require("../../assets/background-gradient.png")}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* Overlay tối + hiệu ứng blur nhẹ */}
      <View className="absolute inset-0 bg-black/70" />

      <Animated.View
        style={{ opacity: fadeAnim }}
        className="items-center justify-center"
      >
        {/* Logo nổi bật với shadow */}
        <View className="rounded-full p-4 bg-white shadow-2xl">
          <Image
            source={require("../../assets/logo_bingbong.png")}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        {/* Text hiện đại */}
        <Text className="text-white text-xl font-bold mt-6 tracking-widest">
          BingBong
        </Text>
        <Text className="text-gray-300 text-sm mt-1">
          Mạng xã hội kết nối mọi người
        </Text>
      </Animated.View>
    </View>
  );
}
