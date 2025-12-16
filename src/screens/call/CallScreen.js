import React from "react";
import { View, StyleSheet } from "react-native";
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
} from "@zegocloud/zego-uikit-prebuilt-call-rn";
import { useNavigation, useRoute } from "@react-navigation/native";

// --- THAY THÔNG TIN CỦA BẠN VÀO ĐÂY ---
const AppID = 507359619; // Thay bằng AppID của bạn (kiểu số)
const AppSign =
  "c4b99c7c15301fd635ceba6c6157862a39d8359502aa65c6d7c86b5d92d7c71a"; // Thay bằng AppSign của bạn (kiểu chuỗi)

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Nhận thông tin từ màn hình Chat
  const { callID, userID, userName } = route.params;

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={AppID}
        appSign={AppSign}
        userID={userID} // ID của người đang dùng app
        userName={userName} // Tên hiển thị
        callID={callID} // ID cuộc gọi (2 người phải trùng nhau)
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onOnlySelfInRoom: () => {
            // Tự động thoát nếu chỉ còn 1 mình trong phòng
            navigation.goBack();
          },
          onHangUp: () => {
            // Xử lý khi bấm nút kết thúc
            navigation.goBack();
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black", // Nền đen cho video call
  },
});
