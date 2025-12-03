import api from "../api/api";

// 1. Lấy danh sách bài viết
export const getAllPosts = async () => {
  try {
    const response = await api.get("/posts");
    return {
      success: true,
      message: "Lấy danh sách thành công",
      data: response.data.posts || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch posts",
      data: [],
    };
  }
};

// 2. Tạo bài viết mới
export const createNewPost = async (
  content,
  images,
  postedByType,
  postedById
) => {
  try {
    const formData = new FormData();
    formData.append("content", content);
    formData.append("postedByType", postedByType);
    formData.append("postedById", postedById);

    console.log("🟡 Service sending FormData:", {
      type: postedByType,
      id: postedById,
    });

    if (images && images.length > 0) {
      images.forEach((img, index) => {
        if (!img.uri.startsWith("http")) {
          const filename = img.uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append("images", {
            uri: img.uri,
            name: filename || `image_${index}.jpg`,
            type: type,
          });
        }
      });
    }

    const response = await api.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Service Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể đăng bài viết.",
    };
  }
};

// 3. Thả cảm xúc (Like/Love/...)
export const reactToPost = async (postId, type) => {
  try {
    const response = await api.post(`/posts/react`, { postId, type });
    return {
      success: true,
      message: response.data.message || "Thả cảm xúc thành công",
      data: response.data.data || {},
    };
  } catch (error) {
    console.error("React Post Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi thả cảm xúc",
      data: {},
    };
  }
};

// 4. Thêm bình luận
export const addComment = async (postId, content) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return {
      success: true,
      message: response.data.message || "Bình luận thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Add Comment Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi bình luận",
    };
  }
};

// 5. Trả lời bình luận
export const addReply = async (commentId, content) => {
  try {
    const response = await api.post(`/posts/comments/${commentId}/replies`, {
      content,
    });
    return {
      success: true,
      message: response.data.message || "Trả lời thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Add Reply Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi câu trả lời",
    };
  }
};

// 6. Lấy danh sách bình luận
export const getComments = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}/comments`);
    return {
      success: true,
      message: "Lấy bình luận thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Get Comments Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bình luận",
    };
  }
};

// 7. Xóa bài viết
export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return {
      success: true,
      message: response.data.message || "Xóa bài viết thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Delete Post Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể xóa bài viết",
    };
  }
};
export const getUserPosts = async (userId, page = 1, limit = 10) => {
  if (!userId) return { success: false, message: "User ID không hợp lệ", data: [] };

  try {
    const response = await api.get(`/posts/by/User/${userId}?page=${page}&limit=${limit}`);

    const posts = response.data?.posts || [];
    
    return { success: true, message: response.data?.message || "", data: posts };
  } catch (error) {
    console.error("Get User Posts Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Không thể lấy bài viết",
      data: [],
    };
  }
};
