import React, { useRef, useEffect, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";

export default function SpinnerLoading() {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;
    const dotsAnim = useRef(new Animated.Value(0)).current;
    const [dots, setDots] = useState("");

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(colorAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false,
                }),
                Animated.timing(colorAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false,
                }),
            ])
        ).start();

        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(dotsAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
                Animated.timing(dotsAnim, { toValue: 2, duration: 300, useNativeDriver: false }),
                Animated.timing(dotsAnim, { toValue: 3, duration: 300, useNativeDriver: false }),
                Animated.timing(dotsAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
            ])
        );
        loop.start();

        // Update state dots
        const listener = dotsAnim.addListener(({ value }) => {
            setDots(".".repeat(Math.floor(value)));
        });

        return () => {
            dotsAnim.removeListener(listener);
            loop.stop();
        };
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const color = colorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#1877F2", "#3AB3FF"],
    });

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
            <Animated.View
                style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 7,
                    borderColor: "#EEF3FF",
                    borderTopColor: color,
                    marginBottom: 24,
                    transform: [{ rotate: spin }],
                }}
            />

            {/* Text BingBong Loading... */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1877F2", letterSpacing: 1 }}>
                    BingBong{" "}
                </Text>
                <Text style={{ fontSize: 28, fontWeight: "bold", color: "#1877F2", letterSpacing: 1 }}>
                    Loading{dots}
                </Text>
            </View>
        </View>
    );
}
