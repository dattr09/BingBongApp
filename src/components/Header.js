import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // Thêm dòng này

export default function Header({ onPressNotification }) {
    const navigation = useNavigation(); // Lấy navigation từ hook

    return (
        <View className="flex-row items-center justify-between px-6 py-3 bg-white rounded-b-2xl shadow-lg w-full">
            {/* Logo nhỏ lại */}
            <Image
                source={require("../../assets/logo_bingbong.png")}
                style={{ width: 44, height: 44, resizeMode: "contain" }}
            />

            {/* Icon group */}
            <View className="flex-row items-center">
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Search")}
                >
                    <Ionicons name="search" size={22} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                    onPress={onPressNotification}
                >
                    <Ionicons name="notifications" size={22} color="#FF4D4F" />
                </TouchableOpacity>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                >
                    <FontAwesome name="users" size={20} color="#1890FF" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("Messenger")}
                    className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mx-1"
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#1890FF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
