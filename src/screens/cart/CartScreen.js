import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getCart, removeFromCart, addToCart, minusFromCart } from "../../services/cartService";
import { getFullUrl } from "../../utils/getPic";
import Toast from "react-native-toast-message";
import { emitCartUpdate } from "../../utils/cartEventEmitter";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const CartItem = ({ item, onUpdate, onRemove, colors, navigation }) => {
  const selectedVariant = item.product?.variants?.find(
    (variant) => variant._id === item.variant
  );

  const handleProductPress = () => {
    if (item.product?.slug && item.product?.shop?.slug) {
      navigation.navigate("DetailShop", {
        shopSlug: item.product.shop.slug,
        productSlug: item.product.slug,
      });
    }
  };

  return (
    <View style={{ 
      borderRadius: 12, 
      padding: 16, 
      marginBottom: 16, 
      backgroundColor: colors.card, 
      borderWidth: 1, 
      borderColor: colors.border 
    }}>
      <View style={{ flexDirection: "row", gap: 16 }}>
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.8}>
          <Image
            source={{ uri: getFullUrl(selectedVariant?.image) }}
            style={{ width: 120, height: 120, borderRadius: 12 }}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>
            {item.product?.shop?.name || ""}
          </Text>
          <TouchableOpacity onPress={handleProductPress} activeOpacity={0.8}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
              {selectedVariant?.name || ""}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
              {item.product?.name || ""}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#f59e0b" }}>
            {formatPrice(item.price)}
          </Text>
        </View>
      </View>

      {/* Quantity Controls */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginTop: 16, 
        paddingTop: 16, 
        borderTopWidth: 1, 
        borderTopColor: colors.border 
      }}>
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          borderRadius: 20, 
          borderWidth: 2, 
          borderColor: colors.border,
          overflow: "hidden"
        }}>
          {item.quantity > 1 ? (
            <TouchableOpacity
              onPress={() => onUpdate(item.quantity - 1)}
              style={{ 
                width: 40, 
                height: 40, 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: colors.surface
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onRemove()}
              style={{ 
                width: 40, 
                height: 40, 
                alignItems: "center", 
                justifyContent: "center",
                backgroundColor: colors.surface
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
          <Text style={{ 
            paddingHorizontal: 16, 
            fontSize: 16, 
            fontWeight: "600",
            color: colors.text 
          }}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => onUpdate(item.quantity + 1)}
            style={{ 
              width: 40, 
              height: 40, 
              alignItems: "center", 
              justifyContent: "center",
              backgroundColor: colors.surface
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const res = await getCart();
      if (res.success) {
        setCart(res.data);
      }
    } catch (error) {
      console.error("Fetch cart error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchCart();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [fetchCart])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      const currentQuantity = item.quantity;
      const difference = newQuantity - currentQuantity;
      
      if (difference > 0) {
        for (let i = 0; i < difference; i++) {
          const res = await addToCart(item.product._id, item.variant);
          if (!res.success) {
            Toast.show({ type: "error", text1: res.message || "Failed to update cart" });
            return;
          }
        }
      } else if (difference < 0) {
        for (let i = 0; i < Math.abs(difference); i++) {
          const res = await minusFromCart(item.product._id, item.variant);
          if (!res.success) {
            Toast.show({ type: "error", text1: res.message || "Failed to update cart" });
            return;
          }
        }
      }
      
      fetchCart();
      emitCartUpdate();
      Toast.show({ type: "success", text1: "Cart updated" });
    } catch (error) {
      console.error("Update quantity error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    }
  };

  const handleRemove = async (item) => {
    try {
      const res = await removeFromCart(item.product._id, item.variant);
      if (res.success) {
        fetchCart();
        emitCartUpdate();
        Toast.show({ type: "success", text1: "Item removed from cart" });
      } else {
        Toast.show({ type: "error", text1: res.message || "Failed to remove item" });
      }
    } catch (error) {
      console.error("Remove item error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    }
  };

  if (loading && !refreshing && !cart) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout disableScroll={true}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ 
          borderRadius: 12, 
          padding: 16, 
          marginBottom: 16, 
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
            Shopping Cart
          </Text>
        </View>

        {/* Cart Items */}
        <FlatList
          data={cart?.items || []}
          keyExtractor={(item, index) =>
            `${item.product?._id}-${item.variant}-${index}`
          }
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onUpdate={(qty) => handleUpdateQuantity(item, qty)}
              onRemove={() => handleRemove(item)}
              colors={colors}
              navigation={navigation}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, padding: 20 }}>
              <Ionicons name="cart-outline" size={80} color={colors.textTertiary} />
              <Text style={{ 
                textAlign: "center", 
                marginTop: 16, 
                fontSize: 18, 
                color: colors.textSecondary 
              }}>
                Your cart is empty
              </Text>
              <Text style={{ 
                textAlign: "center", 
                marginTop: 8, 
                fontSize: 14, 
                color: colors.textTertiary 
              }}>
                Add some products to continue shopping
              </Text>
            </View>
          }
        />

        {/* Order Summary - Fixed at bottom */}
        {cart?.items?.length > 0 && (
          <View 
            style={{ 
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: colors.card, 
              borderTopWidth: 1, 
              borderTopColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>Subtotal</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                {formatPrice(cart?.total || 0)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary }}>Shipping Fee</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.success }}>Free</Text>
            </View>
            <View style={{ 
              paddingTop: 16, 
              marginBottom: 16, 
              borderTopWidth: 1, 
              borderTopColor: colors.border 
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
                  {formatPrice(cart?.total || 0)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Checkout")}
              style={{ 
                borderRadius: 12, 
                paddingVertical: 16,
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: "#fff", 
                fontSize: 18, 
                fontWeight: "bold", 
                textAlign: "center" 
              }}>
                Checkout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

