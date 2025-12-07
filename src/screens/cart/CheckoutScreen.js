import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getCart } from "../../services/cartService";
import { createOrder } from "../../services/orderService";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await getCart();
        if (res.success) {
          setCart(res.data);
        }
      } catch (error) {
        console.error("Fetch cart error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          product: item.product._id,
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress,
        phoneNumber,
        totalAmount: cart.total,
      };

      const res = await createOrder(orderData);
      if (res.success) {
        Alert.alert("Thành công", "Đặt hàng thành công!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Order");
            },
          },
        ]);
      } else {
        Alert.alert("Lỗi", res.message || "Không thể đặt hàng");
      }
    } catch (error) {
      console.error("Place order error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-gray-500 text-center">
            Giỏ hàng trống
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Shipping Info */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Thông tin giao hàng
            </Text>
            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-2">Địa chỉ giao hàng</Text>
              <TextInput
                placeholder="Nhập địa chỉ giao hàng"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
            <View>
              <Text className="text-sm text-gray-600 mb-2">Số điện thoại</Text>
              <TextInput
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Tóm tắt đơn hàng
            </Text>
            {cart.items.map((item, index) => {
              const variant = item.product?.variants?.find(
                (v) => v._id === item.variant
              );
              return (
                <View
                  key={index}
                  className={`flex-row justify-between pb-3 ${
                    index < cart.items.length - 1 && "border-b border-gray-200 mb-3"
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">
                      {variant?.name || item.product?.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      x{item.quantity}
                    </Text>
                  </View>
                  <Text className="text-gray-800 font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              );
            })}
            <View className="border-t border-gray-200 pt-3 mt-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-800 font-medium">
                  {formatPrice(cart.total)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Shipping Fee</Text>
                <Text className="text-green-600 font-medium">Free</Text>
              </View>
              <View className="border-t border-gray-200 pt-3 mt-2">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold text-gray-800">Total</Text>
                  <Text className="text-lg font-semibold text-blue-600">
                    {formatPrice(cart.total)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={submitting}
            className="bg-blue-600 rounded-full py-4 mb-8"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Đặt hàng
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MainLayout>
  );
}

