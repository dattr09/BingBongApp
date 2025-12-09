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
import { useThemeSafe } from "../../utils/themeHelper";
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
  const { colors } = useThemeSafe();
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
      Alert.alert("Error", "Please enter shipping address");
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Please enter phone number");
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
        Alert.alert("Success", "Order placed successfully!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Order");
            },
          },
        ]);
      } else {
        Alert.alert("Error", res.message || "Unable to place order");
      }
    } catch (error) {
      console.error("Place order error:", error);
      Alert.alert("Error", "An error occurred while placing order");
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
          <Text className="text-center" style={{ color: colors.textSecondary }}>
            Cart is empty
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        <View className="p-4">
          {/* Shipping Info */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Shipping Information
            </Text>
            <View className="mb-3">
              <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>Shipping Address</Text>
              <TextInput
                placeholder="Enter shipping address"
                placeholderTextColor={colors.textTertiary}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                multiline
                className="rounded-lg px-4 py-3 text-base"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
              />
            </View>
            <View>
              <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>Phone Number</Text>
              <TextInput
                placeholder="Enter phone number"
                placeholderTextColor={colors.textTertiary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                className="rounded-lg px-4 py-3 text-base"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
              />
            </View>
          </View>

          {/* Order Summary */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Order Summary
            </Text>
            {cart.items.map((item, index) => {
              const variant = item.product?.variants?.find(
                (v) => v._id === item.variant
              );
              return (
                <View
                  key={index}
                  className="flex-row justify-between pb-3"
                  style={index < cart.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 } : {}}
                >
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: colors.text }}>
                      {variant?.name || item.product?.name}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>
                      x{item.quantity}
                    </Text>
                  </View>
                  <Text className="font-medium" style={{ color: colors.text }}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              );
            })}
            <View className="pt-3 mt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                <Text className="font-medium" style={{ color: colors.text }}>
                  {formatPrice(cart.total)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.textSecondary }}>Shipping Fee</Text>
                <Text className="font-medium" style={{ color: colors.success }}>Free</Text>
              </View>
              <View className="pt-3 mt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>Total</Text>
                  <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
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
            className="rounded-full py-4 mb-8"
            style={{ backgroundColor: colors.primary }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-semibold text-center">
                Place Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MainLayout>
  );
}

