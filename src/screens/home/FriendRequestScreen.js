import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  acceptFriendRequest,
  declineFriendRequest,
} from "../../services/friendService";
import { API_URL } from "@env";
export default function FriendRequestScreen({ invites = [], onUpdateList }) {
  // Local state để quản lý danh sách (giúp xóa item ngay lập tức khi bấm)
  const [requestList, setRequestList] = useState(invites);
  const [processingId, setProcessingId] = useState(null); // Để hiện loading spinner trên nút đang bấm

  // Helper: Xử lý URL ảnh
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  // --- 1. XỬ LÝ CHẤP NHẬN ---
  const handleAccept = async (userId) => {
    setProcessingId(userId); // Bật loading
    const result = await acceptFriendRequest(userId);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã chấp nhận lời mời kết bạn",
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
      Toast.show({ type: "success", text1: "Đã từ chối lời mời" });
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
      <Text className="text-center text-gray-400 mb-6 mt-4">
        Không có lời mời nào
      </Text>
    );
  }

  return (
    <View className="mb-4">
      <Text className="text-xl font-extrabold text-green-700 mb-5 mt-2 tracking-wide px-1">
        Lời mời kết bạn ({requestList.length})
      </Text>
      {requestList.map((user) => (
        <View
          key={user._id}
          className="flex-row items-center gap-4 rounded-3xl bg-white shadow-sm mb-4 px-4 py-4 border border-green-50"
        >
          <Image
            source={{ uri: getAvatarUrl(user.avatar) }}
            className="h-16 w-16 rounded-full border-2 border-green-200"
          />
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 mb-2">
              {user.fullName || `${user.firstName} ${user.surname}`}
            </Text>

            <View className="flex-row gap-3">
              {/* Nút Chấp nhận */}
              <TouchableOpacity
                className="flex-1 rounded-lg bg-green-600 py-2 items-center justify-center shadow-sm"
                onPress={() => handleAccept(user._id)}
                disabled={processingId === user._id}
              >
                {processingId === user._id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold text-xs">
                    Chấp nhận
                  </Text>
                )}
              </TouchableOpacity>

              {/* Nút Từ chối */}
              <TouchableOpacity
                className="flex-1 rounded-lg bg-red-50 py-2 items-center justify-center border border-red-100"
                onPress={() => handleDecline(user._id)}
                disabled={processingId === user._id}
              >
                <Text className="text-red-500 font-bold text-xs">Từ chối</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
