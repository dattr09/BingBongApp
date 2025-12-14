import api from "../api/api";

export const getProductsByShop = async (shopId, query = {}) => {
  try {
    const response = await api.get(`/product/shop/${shopId}`, { params: query });
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch products",
      data: [],
    };
  }
};

export const getProductBySlug = async (slug, shopId) => {
  try {
    const response = await api.get(`/product/slug/${slug}/${shopId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch product",
    };
  }
};

export const getProductById = async (id) => {
  try {
    const response = await api.get(`/product/id/${id}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch product",
    };
  }
};

export const rateProduct = async (productId, ratingData) => {
  try {
    const response = await api.post(`/product/rating/${productId}`, ratingData);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to submit rating",
    };
  }
};

