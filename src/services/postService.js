import api from "../api/api";

export const postAPI = {
  createPost: async (postData) => {
    try {
      const response = await api.post("/posts", postData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "Tạo bài viết thành công",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("Create Post Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Đã có lỗi xảy ra khi tạo bài viết",
        data: {},
      };
    }
  },

  getPostById: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("Get Post By ID Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy bài viết",
        data: {},
      };
    }
  },

  reactToPost: async (postId, type) => {
    try {
      const response = await api.post(`/posts/react`, { postId, type });
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "Thả cảm xúc thành công",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("React To Post Error:", error);
      return {
        success: false,
        message: "Đã có lỗi xảy ra khi thả cảm xúc",
        data: {},
      };
    }
  },

  getFeed: async () => {
    try {
      const response = await api.get("/posts");
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "",
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error("Get Feed Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy feed",
        data: [],
      };
    }
  },

  getPostsByOwner: async (type, id, page = 1, limit = 10) => {
    try {
      const response = await api.get(
        `/posts/by/${type}/${id}?page=${page}&limit=${limit}`
      );
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "",
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error("Get Posts By Owner Error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Không thể lấy bài viết của user",
        data: [],
      };
    }
  },

  addComment: async (postId, commentData) => {
    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        content: commentData,
      });
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "Bình luận thành công",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("Add Comment Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể thêm bình luận",
        data: {},
      };
    }
  },

  addReply: async (commentId, replyData) => {
    try {
      const response = await api.post(`/posts/comments/${commentId}/replies`, {
        content: replyData,
      });
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "Trả lời thành công",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("Add Reply Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể trả lời bình luận",
        data: {},
      };
    }
  },

  getComments: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "",
        data: response.data?.data || [],
      };
    } catch (error) {
      console.error("Get Comments Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể lấy bình luận",
        data: [],
      };
    }
  },

  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return {
        success: response.data?.success ?? true,
        message: response.data?.message || "Xóa bài viết thành công",
        data: response.data?.data || {},
      };
    } catch (error) {
      console.error("Delete Post Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Không thể xóa bài viết",
        data: {},
      };
    }
  },
};
