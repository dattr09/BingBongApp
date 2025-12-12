import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "../../services/friendService";
export default function FriendRequestScreen({ invites = [], onUpdateList }) {
  const { colors } = useThemeSafe();
  // Local state để quản lý danh sách (giúp xóa item ngay lập tức khi bấm)
  const [requestList, setRequestList] = useState(invites);
  const [processingId, setProcessingId] = useState(null); // Để hiện loading spinner trên nút đang bấm

  // --- 1. XỬ LÝ CHẤP NHẬN ---
  const handleAccept = async (userId) => {
    setProcessingId(userId); // Bật loading
    const result = await acceptFriendRequest(userId);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Friend request accepted",
      });
      // Xóa user khỏi list hiển thị
      const newList = requestList.filter((u) => u._id !== userId);
      setRequestList(newList);
      // Gọi callback nếu cha cần biết (ví dụ để giảm số badge thông báo)
      if (onUpdateList) onUpdateList(newList);
    } else {
      Toast.show({ type: "error", text1: "Lỗi", text2: result.message });
    }
    setProcessingId(null); // Tắt loading
  };

  // --- 2. XỬ LÝ TỪ CHỐI ---
  const handleDecline = async (userId) => {
    setProcessingId(userId);
    const result = await declineFriendRequest(userId);

    if (result.success) {
      Toast.show({ type: "success", text1: "Friend request declined" });
      const newList = requestList.filter((u) => u._id !== userId);
      setRequestList(newList);
      if (onUpdateList) onUpdateList(newList);
    } else {
      Toast.show({ type: "error", text1: "Lỗi", text2: result.message });
    }
    setProcessingId(null);
  };

  // Cập nhật lại list nếu props thay đổi (ví dụ khi reload từ cha)
  React.useEffect(() => {
    setRequestList(invites);
  }, [invites]);

  if (!requestList.length) {
    return (
      <Text className="text-center mb-6 mt-4" style={{ color: colors.textTertiary }}>
        No friend requests
      </Text>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-xl font-extrabold mb-5 mt-2 tracking-wide px-1" style={{ color: colors.success }}>
        Friend Requests ({requestList.length})
      </Text>
      {requestList.map((user) => (
        <View
          key={user._id}
          className="flex-row items-center gap-4 rounded-3xl shadow-sm mb-4 px-4 py-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <Image
            source={{ uri: getFullUrl(user.avatar) || "https://i.pravatar.cc/300?img=1" }}
            className="h-16 w-16 rounded-full border-2"
            style={{ borderColor: colors.success + '50' }}
          />
          <View className="flex-1">
            <Text className="text-base font-bold mb-2" style={{ color: colors.text }}>
              {user.fullName || `${user.firstName} ${user.surname}`}
            </Text>

            <View className="flex-row gap-3">
              {/* Nút Chấp nhận */}
              <TouchableOpacity
                className="flex-1 rounded-lg py-2 items-center justify-center shadow-sm"
                style={{ backgroundColor: colors.success }}
                onPress={() => handleAccept(user._id)}
                disabled={processingId === user._id}
              >
                {processingId === user._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-xs">
                    Accept
                  </Text>
                )}
              </TouchableOpacity>

              {/* Nút Từ chối */}
              <TouchableOpacity
                className="flex-1 rounded-lg py-2 items-center justify-center"
                style={{ backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '30' }}
                onPress={() => handleDecline(user._id)}
                disabled={processingId === user._id}
              >
                <Text className="font-bold text-xs" style={{ color: colors.error }}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
