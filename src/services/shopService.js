import api from "../api/api";

export const getAllShops = async () => {
  try {
    const response = await api.get("/shop");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch shops",
      data: [],
    };
  }
};

export const getMyShops = async () => {
  try {
    const response = await api.get("/shop/my-shops");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch my shops",
      data: [],
    };
  }
};

export const getFollowedShops = async () => {
  try {
    const response = await api.get("/shop/followed-shops");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch followed shops",
      data: [],
    };
  }
};

export const getShopBySlug = async (slug) => {
  try {
    const response = await api.get(`/shop/${slug}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch shop",
    };
  }
};

export const followShop = async (shopId) => {
  try {
    const response = await api.post(`/shop/follow/${shopId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to follow shop",
    };
  }
};

export const unfollowShop = async (shopId) => {
  try {
    const response = await api.post(`/shop/unfollow/${shopId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to unfollow shop",
    };
  }
};

export const getShopProductRatings = async (shopId) => {
  try {
    const response = await api.get(`/shop/${shopId}/product-ratings`);
    return {
      success: true,
      data: response.data.data || response.data || [],
      averageRating: response.data.averageRating || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch product ratings",
      data: [],
      averageRating: 0,
    };
  }
};

export const getShopNewProducts = async (shopId) => {
  try {
    const response = await api.get(`/shop/${shopId}/new-products`);
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch new products",
      data: [],
    };
  }
};

export const updateShopInfo = async (shopId, shopData) => {
  try {
    const response = await api.put(`/shop/info/${shopId}`, shopData);
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || "Shop information updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update shop information",
    };
  }
};

