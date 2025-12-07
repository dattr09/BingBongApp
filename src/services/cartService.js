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
      product: productId,
      variant: variantId,
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
    const response = await api.post("/cart/remove", {
      product: productId,
      variant: variantId,
    });
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

// Update cart item quantity
export const updateCartQuantity = async (productId, variantId, quantity) => {
  try {
    const response = await api.put("/cart/update", {
      product: productId,
      variant: variantId,
      quantity,
    });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("UpdateCartQuantity Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update cart",
    };
  }
};

