import api from "../api/api";

// ============================================================
// 1. MESSAGE SERVICES
// ============================================================

export const sendMessage = async (messageData) => {
  try {
    const response = await api.post("/messages/send-message", messageData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      message: response.data.message || "Gửi tin nhắn thành công",
      data: response.data.data || response.data, // Đảm bảo lấy đúng data
    };
  } catch (error) {
    console.error("SendMessage Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Gửi tin nhắn thất bại",
    };
  }
};

export const getHistoryChat = async (userChatId) => {
  try {
    const response = await api.get(`/messages/history/${userChatId}`);

    // FIX: Xử lý cấu trúc lồng nhau { success: true, data: [...] }
    const messages = response.data?.data || response.data || [];

    return {
      success: true,
      message: "Lấy lịch sử chat thành công",
      data: Array.isArray(messages) ? messages : [], // Luôn trả về mảng
    };
  } catch (error) {
    console.error("GetHistoryChat Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải lịch sử chat",
      data: [],
    };
  }
};

// ... giữ nguyên getAIResponse ...

// ============================================================
// 2. CHAT MANAGEMENT SERVICES
// ============================================================

export const getRecentChats = async () => {
  try {
    const response = await api.get(`/chat/recent`);

    // FIX: Xử lý cấu trúc lồng nhau
    const chats = response.data?.data || response.data || [];

    return {
      success: true,
      data: Array.isArray(chats) ? chats : [], // Luôn trả về mảng
    };
  } catch (error) {
    console.error("GetRecentChats Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải danh sách chat",
      data: [],
    };
  }
};

// ... giữ nguyên các hàm khác (createGroupChat, createQuiz...) ...
// Bạn có thể copy lại phần còn thiếu từ file cũ nếu cần, hoặc để tôi bổ sung đầy đủ nếu bạn yêu cầu.
export const getChatIdByUserId = async (userId) => {
  try {
    const response = await api.get(`/chat/with/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, message: "Lỗi lấy thông tin đoạn chat" };
  }
};
