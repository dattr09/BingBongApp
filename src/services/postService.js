import api from "../api/api";

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
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch posts",
      data: [],
    };
  }
};

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

    if (images && images.length > 0) {
      images.forEach((img, index) => {
        const filename = img.uri.split("/").pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("images", {
          uri: img.uri,
          name: filename,
          type: type,
        });
      });
    }

    const response = await api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: (data) => {
        return data;
      },
    });

    const postData = response.data.post || response.data.data || response.data;
    
    let fullPostData = postData;
    if (postData._id) {
      try {
        const fullPostResponse = await api.get(`/posts/${postData._id}`);
        if (fullPostResponse.data.success && fullPostResponse.data.post) {
          fullPostData = fullPostResponse.data.post;
        }
      } catch (error) {
      }
    }
    
    return { 
      success: true, 
      data: fullPostData,
      message: response.data.message || "Đăng bài thành công"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể đăng bài viết.",
    };
  }
};

export const reactToPost = async (postId, type) => {
  try {
    const response = await api.post(`/posts/react`, { postId, type });
    return {
      success: true,
      message: response.data.message || "Thả cảm xúc thành công",
      data: response.data.data || {},
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi thả cảm xúc",
      data: {},
    };
  }
};

export const addComment = async (postId, content) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return {
      success: true,
      message: response.data.message || "Bình luận thành công",
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gửi bình luận",
    };
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return {
      success: true,
      message: response.data.message || "Xóa bài viết thành công",
      data: response.data,
    };
  } catch (error) {
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
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Không thể lấy bài viết",
      data: [],
    };
  }
};

export const getGroupPosts = async (groupId) => {
  if (!groupId) return { success: false, message: "Group ID không hợp lệ", data: [] };

  try {
    const response = await api.get(`/posts/by/Group/${groupId}`);
    const posts = response.data?.posts || [];
    
    return { success: true, message: response.data?.message || "", data: posts };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Không thể lấy bài viết",
      data: [],
    };
  }
};

export const getShopPosts = async (shopId) => {
  if (!shopId) return { success: false, message: "Shop ID không hợp lệ", data: [] };

  try {
    const response = await api.get(`/posts/by/Shop/${shopId}`);
    const posts = response.data?.posts || [];
    
    return { success: true, message: response.data?.message || "", data: posts };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Không thể lấy bài viết",
      data: [],
    };
  }
};

export const getPostById = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}`);
    return {
      success: true,
      message: "Lấy bài viết thành công",
      data: response.data.post || response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bài viết",
    };
  }
};

export const getComments = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}/comments`);
    return {
      success: true,
      message: "Lấy bình luận thành công",
      data: response.data.comments || response.data.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bình luận",
      data: [],
    };
  }
};

export const addReply = async (commentId, content) => {
  try {
    const response = await api.post(`/posts/comments/${commentId}/replies`, {
      content,
    });
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