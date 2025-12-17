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
      data: response.data.data || response.data,
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
    const messages = response.data?.data || response.data || [];

    return {
      success: true,
      message: "Lấy lịch sử chat thành công",
      data: Array.isArray(messages) ? messages : [],
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

export const getAIResponse = async (prompt) => {
  try {
    const response = await api.post("/messages/generate-ai-response", {
      prompt,
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "AI response received",
    };
  } catch (error) {
    console.error("GetAIResponse Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to get AI response",
    };
  }
};

// ============================================================
// 2. CHAT MANAGEMENT SERVICES
// ============================================================

export const getRecentChats = async () => {
  try {
    const response = await api.get(`/chat/recent`);
    const chats = response.data?.data || response.data || [];

    return {
      success: true,
      data: Array.isArray(chats) ? chats : [],
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

export const getChatIdByUserId = async (userId) => {
  try {
    const response = await api.get(`/chat/with`, {
      params: {
        userId,
        type: "private",
      },
    });
    if (response.data.success === false) {
      return {
        success: false,
        message: response.data.message || "Lỗi lấy thông tin đoạn chat",
      };
    }
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetChatIdByUserId Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy thông tin đoạn chat",
    };
  }
};

// Get chat ID by type and ID (for group, shop, etc.)
export const getChatIdByTypeId = async (params) => {
  try {
    const response = await api.get(`/chat/with`, { params });

    if (response.data.success === false) {
      return {
        success: false,
        message: response.data.message || "Lỗi lấy thông tin đoạn chat",
      };
    }

    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetChatIdByTypeId Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy thông tin đoạn chat",
    };
  }
};