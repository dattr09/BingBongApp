import api from "../api/api";

// Get Shorts Feed
export const getShortsFeed = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/shorts/feed?page=${page}&limit=${limit}`);
    return {
      success: true,
      message: "Lấy danh sách shorts thành công",
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch shorts",
      data: [],
    };
  }
};

// Get Short by ID
export const getShortById = async (shortId) => {
  try {
    const response = await api.get(`/shorts/${shortId}`);
    return {
      success: true,
      message: "Lấy short thành công",
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch short",
    };
  }
};

// Toggle Like Short
export const toggleLikeShort = async (shortId) => {
  try {
    const response = await api.post(`/shorts/${shortId}/like`);
    return {
      success: true,
      message: response.data.message || "Thao tác thành công",
      data: response.data.data || {},
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi thao tác",
      data: {},
    };
  }
};

// Increment Views
export const incrementViews = async (shortId) => {
  try {
    const response = await api.post(`/shorts/${shortId}/view`);
    return {
      success: true,
      message: response.data.message || "Đã đếm lượt xem",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi đếm lượt xem",
    };
  }
};

// Get Comments for Short
export const getComments = async (shortId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/shorts/${shortId}/comments?page=${page}&limit=${limit}`);
    return {
      success: true,
      message: "Lấy bình luận thành công",
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bình luận",
      data: [],
    };
  }
};

// Add Comment to Short
export const addComment = async (shortId, content) => {
  try {
    const response = await api.post(`/shorts/${shortId}/comments`, { content });
    return {
      success: true,
      message: response.data.message || "Bình luận thành công",
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi bình luận",
    };
  }
};

// Delete Comment
export const deleteComment = async (commentId) => {
  try {
    const response = await api.delete(`/shorts/comments/${commentId}`);
    return {
      success: true,
      message: response.data.message || "Xóa bình luận thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể xóa bình luận",
    };
  }
};

// Toggle Like Comment
export const toggleLikeComment = async (commentId) => {
  try {
    const response = await api.post(`/shorts/comments/${commentId}/like`);
    return {
      success: true,
      message: response.data.message || "Thao tác thành công",
      data: response.data.data || {},
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi thao tác",
      data: {},
    };
  }
};

// Add Reply to Comment
export const addReply = async (commentId, content) => {
  try {
    const response = await api.post(`/shorts/comments/${commentId}/reply`, { content });
    return {
      success: true,
      message: response.data.message || "Trả lời thành công",
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi câu trả lời",
    };
  }
};

// Get My Shorts
export const getMyShorts = async (page = 1, limit = 10, privacy) => {
  try {
    let url = `/shorts/my-shorts?page=${page}&limit=${limit}`;
    if (privacy) {
      url += `&privacy=${privacy}`;
    }
    const response = await api.get(url);
    return {
      success: true,
      message: "Lấy danh sách shorts của tôi thành công",
      data: response.data.data || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch my shorts",
      data: [],
    };
  }
};

// Delete Short
export const deleteShort = async (shortId) => {
  try {
    const response = await api.delete(`/shorts/${shortId}`);
    return {
      success: true,
      message: response.data.message || "Xóa short thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể xóa short",
    };
  }
};

// Create Short
export const createShort = async (formData, onUploadProgress) => {
  try {
    const response = await api.post("/shorts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onUploadProgress,
      transformRequest: (data) => {
        return data;
      },
    });

    return {
      success: true,
      message: response.data.message || "Short uploaded successfully",
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to upload short",
    };
  }
};
