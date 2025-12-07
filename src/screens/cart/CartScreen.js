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

const CartItem = ({ item, onUpdate, onRemove }) => {
  const selectedVariant = item.product?.variants?.find(
    (variant) => variant._id === item.variant
  );

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
      <View className="flex-row gap-4">
        <Image
          source={{ uri: getFullUrl(selectedVariant?.image) }}
          className="w-24 h-24 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="text-sm text-gray-500">
            {item.product?.shop?.name || ""}
          </Text>
          <Text className="font-semibold text-gray-800 text-base mt-1">
            {selectedVariant?.name || ""}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {item.product?.name || ""}
          </Text>
          <Text className="text-orange-500 font-medium text-lg mt-2">
            {formatPrice(item.price)}
          </Text>
        </View>
      </View>

      {/* Quantity Controls */}
      <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <View className="flex-row items-center border border-gray-300 rounded-full">
          {item.quantity > 1 ? (
            <TouchableOpacity
              onPress={() => onUpdate(item.quantity - 1)}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="remove" size={20} color="#000" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => onRemove()}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
          <Text className="px-4 text-base">{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onUpdate(item.quantity + 1)}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="add" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const navigation = useNavigation();
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
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-2xl font-semibold text-gray-800">
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
            />
          )}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-5">
              <Ionicons name="cart-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4 text-lg">
                Giỏ hàng của bạn đang trống
              </Text>
            </View>
          }
        />

        {/* Order Summary */}
        {cart?.items?.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg text-gray-700">Subtotal</Text>
              <Text className="text-lg font-medium text-gray-800">
                {formatPrice(cart?.total || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-lg text-gray-700">Shipping Fee</Text>
              <Text className="text-lg font-medium text-green-600">Free</Text>
            </View>
            <View className="border-t border-gray-200 pt-4 mb-4">
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold text-gray-800">Total</Text>
                <Text className="text-lg font-semibold text-blue-600">
                  {formatPrice(cart?.total || 0)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Checkout")}
              className="bg-blue-600 rounded-full py-4"
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

