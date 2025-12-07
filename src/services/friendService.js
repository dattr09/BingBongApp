import api from "../api/api";

/**
 * Gửi lời mời kết bạn
 * @param {string} userId - ID người muốn kết bạn
 */
export const sendFriendRequest = async (userId) => {
  try {
    const response = await api.post(`/user/friend-request/${userId}`);

    return {
      success: true,
      message: response.data.message || "Đã gửi lời mời kết bạn",
      data: response.data,
    };
  } catch (error) {
    console.error("Send Friend Request Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi lời mời kết bạn",
    };
  }
};

/**
 * Chấp nhận lời mời kết bạn
 * @param {string} userId - ID người đã gửi lời mời
 */
export const acceptFriendRequest = async (userId) => {
  try {
    const response = await api.post(`/user/friend-request/accept/${userId}`);

    return {
      success: true,
      message: response.data.message || "Đã chấp nhận lời mời",
      data: response.data,
    };
  } catch (error) {
    console.error("Accept Friend Request Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể chấp nhận lời mời",
    };
  }
};

/**
 * Hủy lời mời kết bạn (Mình đã gửi đi nhưng muốn hủy)
 * @param {string} userId - ID người nhận
 */
export const cancelFriendRequest = async (userId) => {
  try {
    const response = await api.delete(`/user/friend-request/${userId}`);

    return {
      success: true,
      message: response.data.message || "Đã hủy lời mời",
      data: response.data,
    };
  } catch (error) {
    console.error("Cancel Friend Request Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể hủy lời mời",
    };
  }
};

/**
 * Từ chối lời mời kết bạn (Người khác gửi đến)
 * @param {string} userId - ID người gửi
 */
export const declineFriendRequest = async (userId) => {
  try {
    const response = await api.delete(`/user/friend-request/decline/${userId}`);

    return {
      success: true,
      message: response.data.message || "Đã từ chối lời mời",
      data: response.data,
    };
  } catch (error) {
    console.error("Decline Friend Request Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể từ chối lời mời",
    };
  }
};

/**
 * Hủy kết bạn (Unfriend)
 * @param {string} userId - ID người muốn hủy kết bạn
 */
export const removeFriend = async (userId) => {
  try {
    const response = await api.delete(`/user/friend/${userId}`);

    return {
      success: true,
      message: response.data.message || "Đã hủy kết bạn",
      data: response.data,
    };
  } catch (error) {
    console.error("Remove Friend Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi hủy kết bạn",
    };
  }
};

/**
 * Lấy danh sách gợi ý kết bạn
 */
export const getSuggestions = async () => {
  try {
    const response = await api.get(`/user/suggestions`);
    // console.log("Get Suggestions Response:", response);
    return {
      success: true,
      message: response.data.message || "Lấy gợi ý thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Get Suggestions Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể lấy danh sách gợi ý",
      data: [],
    };
  }
};
