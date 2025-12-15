import ZegoUIKitPrebuiltCallService from "@zegocloud/zego-uikit-prebuilt-call-rn";
import * as ZIM from "zego-zim-react-native";

const AppID = 123456789;
const AppSign =
  "c4b99c7c15301fd635ceba6c6157862a39d8359502aa65c6d7c86b5d92d7c71a";

// 1. Khởi tạo dịch vụ gọi điện khi User đăng nhập
export const onUserLogin = async (userID, userName) => {
  return ZegoUIKitPrebuiltCallService.init(
    AppID,
    AppSign,
    userID,
    userName,
    [ZIM],
    {
      ringtoneConfig: {
        incomingCallFileName: "zego_incoming.mp3",
        outgoingCallFileName: "zego_outgoing.mp3",
      },
    }
  );
};

// 2. Ngắt dịch vụ khi User đăng xuất
export const onUserLogout = async () => {
  return ZegoUIKitPrebuiltCallService.uninit();
};
