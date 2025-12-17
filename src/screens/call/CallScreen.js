import React from "react";
import { View, StyleSheet } from "react-native";
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
} from "@zegocloud/zego-uikit-prebuilt-call-rn";
import { useNavigation, useRoute } from "@react-navigation/native";

const AppID = "dien trong note"; // Thay bằng AppID của bạn (kiểu số)
const AppSign = "dien trong note"; // Thay bằng AppSign của bạn (kiểu chuỗi)

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
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
            navigation.goBack();
          },
          onHangUp: () => {
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
    backgroundColor: "black",
  },
});
