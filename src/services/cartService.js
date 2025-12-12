import api from "../api/api";

// Get cart
export const getCart = async () => {
  try {
    const response = await api.get("/cart");
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetCart Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch cart",
      data: null,
    };
  }
};

// Add to cart
export const addToCart = async (productId, variantId) => {
  try {
    const response = await api.post("/cart/add", {
      productId,
      variantId,
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("AddToCart Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add to cart",
    };
  }
};

// Remove from cart
export const removeFromCart = async (productId, variantId) => {
  try {
    const response = await api.delete(`/cart/remove/${productId}/${variantId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("RemoveFromCart Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to remove from cart",
    };
  }
};

// Minus from cart (decrease quantity by 1)
export const minusFromCart = async (productId, variantId) => {
  try {
    const response = await api.put("/cart/minus", {
      productId,
      variantId,
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("MinusFromCart Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to decrease quantity",
    };
  }
};

