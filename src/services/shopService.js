import api from "../api/api";

// Get all shops
export const getAllShops = async () => {
  try {
    const response = await api.get("/shops");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetAllShops Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch shops",
      data: [],
    };
  }
};

// Get my shops
export const getMyShops = async () => {
  try {
    const response = await api.get("/shops/my-shops");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetMyShops Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch my shops",
      data: [],
    };
  }
};

// Get followed shops
export const getFollowedShops = async () => {
  try {
    const response = await api.get("/shops/followed-shops");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetFollowedShops Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch followed shops",
      data: [],
    };
  }
};

// Get shop by slug
export const getShopBySlug = async (slug) => {
  try {
    const response = await api.get(`/shops/${slug}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetShopBySlug Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch shop",
    };
  }
};

// Follow shop
export const followShop = async (shopId) => {
  try {
    const response = await api.post(`/shops/${shopId}/follow`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("FollowShop Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to follow shop",
    };
  }
};

// Unfollow shop
export const unfollowShop = async (shopId) => {
  try {
    const response = await api.post(`/shops/${shopId}/unfollow`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("UnfollowShop Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to unfollow shop",
    };
  }
};

