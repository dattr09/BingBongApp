import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Image
        source={require("../../assets/background-gradient.png")}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* Làm background đậm hơn */}
      <View className="absolute inset-0 bg-black opacity-80" />

      <Animated.View style={{ opacity: fadeAnim }} className="items-center">
        <Image
          source={require("../../assets/logo_bingbong.png")}
          className="w-28 h-28 mb-4"
        />
        {/* Đưa chữ xuống dưới thêm */}
        <Text className="text-gray-300 mt-6 text-base">
          BingBong mạng xã hội
        </Text>
      </Animated.View>
    </View>
  );
}
