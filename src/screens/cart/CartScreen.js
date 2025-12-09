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
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getCart, removeFromCart, updateCartQuantity } from "../../services/cartService";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const CartItem = ({ item, onUpdate, onRemove, colors }) => {
  const selectedVariant = item.product?.variants?.find(
    (variant) => variant._id === item.variant
  );

  return (
    <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      <View className="flex-row gap-4">
        <Image
          source={{ uri: getFullUrl(selectedVariant?.image) }}
          className="w-24 h-24 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {item.product?.shop?.name || ""}
          </Text>
          <Text className="font-semibold text-base mt-1" style={{ color: colors.text }}>
            {selectedVariant?.name || ""}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {item.product?.name || ""}
          </Text>
          <Text className="font-medium text-lg mt-2" style={{ color: colors.warning }}>
            {formatPrice(item.price)}
          </Text>
        </View>
      </View>

      {/* Quantity Controls */}
      <View className="flex-row items-center justify-between mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
        <View className="flex-row items-center rounded-full" style={{ borderWidth: 1, borderColor: colors.border }}>
          {item.quantity > 1 ? (
            <TouchableOpacity
              onPress={() => onUpdate(item.quantity - 1)}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onRemove()}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
          <Text className="px-4 text-base" style={{ color: colors.text }}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdate(item.quantity + 1)}
            className="w-10 h-10 items-center justify-center"
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQuantity = async (item, newQuantity) => {
    try {
      const res = await updateCartQuantity(
        item.product._id,
        item.variant,
        newQuantity
      );
      if (res.success) {
        fetchCart();
      }
    } catch (error) {
      console.error("Update quantity error:", error);
    }
  };

  const handleRemove = async (item) => {
    try {
      const res = await removeFromCart(item.product._id, item.variant);
      if (res.success) {
        fetchCart();
      }
    } catch (error) {
      console.error("Remove item error:", error);
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
      <View className="flex-1">
        {/* Header */}
        <View className="rounded-lg p-4 mb-4 shadow-sm" style={{ backgroundColor: colors.card }}>
          <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
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
            />
          )}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-5">
              <Ionicons name="cart-outline" size={64} color={colors.textTertiary} />
              <Text className="text-center mt-4 text-lg" style={{ color: colors.textSecondary }}>
                Your cart is empty
              </Text>
            </View>
          }
        />

        {/* Order Summary */}
        {cart?.items?.length > 0 && (
          <View 
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg" style={{ color: colors.textSecondary }}>Subtotal</Text>
              <Text className="text-lg font-medium" style={{ color: colors.text }}>
                {formatPrice(cart?.total || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-lg" style={{ color: colors.textSecondary }}>Shipping Fee</Text>
              <Text className="text-lg font-medium" style={{ color: colors.success }}>Free</Text>
            </View>
            <View className="pt-4 mb-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>Total</Text>
                <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                  {formatPrice(cart?.total || 0)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Checkout")}
              className="rounded-full py-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-white text-lg font-semibold text-center">
                Checkout
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

