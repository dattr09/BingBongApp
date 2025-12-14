import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getProductBySlug, getProductsByShop, rateProduct } from "../../services/productService";
import { getShopBySlug } from "../../services/shopService";
import { addToCart } from "../../services/cartService";
import { emitCartUpdate } from "../../utils/cartEventEmitter";
import { getFullUrl } from "../../utils/getPic";
import ProductCard from "../../components/ProductCard";
import Toast from "react-native-toast-message";
import { getUser } from "../../utils/storage";
import { formatDateTime } from "../../utils/timeUtils";

const { width } = Dimensions.get("window");

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function DetailProductScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { productSlug, shopSlug } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Rating state
  const [selectedStars, setSelectedStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productSlug || !shopSlug) return;
      setLoading(true);
      try {
        const shopRes = await getShopBySlug(shopSlug);
        
        if (shopRes.success && shopRes.data) {
          const shopInfo = shopRes.data;
          setShop(shopInfo);
          
          const productRes = await getProductBySlug(productSlug, shopInfo._id);
          if (productRes.success) {
            const productData = productRes.data;
            setProduct(productData);
            
            const thumbnailIndex = productData.images?.findIndex((img) => img.type === "thumbnail") || 0;
            setCurrentIndex(thumbnailIndex >= 0 ? thumbnailIndex : 0);
            
            if (productData.category) {
              const relatedRes = await getProductsByShop(shopInfo._id, {
                category: shopInfo.categories?.find((c) => c.name === productData.category)?.slug,
              });
              if (relatedRes.success) {
                const related = (relatedRes.data || []).filter((p) => p._id !== productData._id).slice(0, 6);
                setRelatedProducts(related);
              }
            }
          }
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Failed to load product" });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productSlug, shopSlug]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh cart count when screen is focused
      navigation.getParent()?.setParams?.({ refreshCart: Date.now() });
    }, [navigation])
  );

  const updateImage = (index) => {
    if (index >= 0 && index < (product?.images?.length || 0)) {
      setCurrentIndex(index);
    }
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      Toast.show({ type: "error", text1: "Please login first!" });
      return;
    }

    if (!product || !product.variants || product.variants.length === 0) {
      Toast.show({ type: "error", text1: "Product variant not available" });
      return;
    }

    const selectedVariant = product.variants[selectedVariantIndex];
    if (selectedVariant.stock <= 0) {
      Toast.show({ type: "error", text1: "This variant is out of stock" });
      return;
    }

    setAddingToCart(true);
    try {
      const res = await addToCart(product._id, selectedVariant._id);
      if (res.success) {
        Toast.show({ type: "success", text1: "Added to cart successfully!" });
        // Emit cart update event to refresh Header badge
        emitCartUpdate();
        return true;
      } else {
        Toast.show({ type: "error", text1: res.message || "Failed to add to cart" });
        return false;
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success && currentUser) {
      navigation.navigate("Cart");
    }
  };

  if (loading) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout disableScroll={true}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Product not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isUnavailable = ["deleted", "inactive"].includes(product.status);
  const selectedVariant = product.variants?.[selectedVariantIndex];
  const finalPrice = selectedVariant?.price || product.basePrice || 0;
  const discount = product.discount || 0;
  const discountedPrice = discount > 0 ? finalPrice - (finalPrice * discount) / 100 : finalPrice;
  const rating = product.totalRating || 0;
  const ratingCount = product.ratings?.length || 0;

  return (
    <MainLayout disableScroll={true}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Product Images */}
        <View style={{ position: "relative", width: "100%", height: 400, backgroundColor: colors.surface }}>
          {product.images && product.images.length > 0 && (
            <>
              <Image
                source={{ uri: getFullUrl(product.images[currentIndex]) }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
              
              {/* Image Counter */}
              <View style={{ position: "absolute", bottom: 16, right: 16, backgroundColor: "rgba(0, 0, 0, 0.7)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                  {currentIndex + 1}/{product.images.length}
                </Text>
              </View>

              {/* Navigation Arrows */}
              {currentIndex > 0 && (
                <TouchableOpacity
                  onPress={() => updateImage(currentIndex - 1)}
                  style={{ position: "absolute", left: 16, top: "50%", transform: [{ translateY: -20 }], backgroundColor: "rgba(0, 0, 0, 0.6)", padding: 12, borderRadius: 25 }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              
              {currentIndex < product.images.length - 1 && (
                <TouchableOpacity
                  onPress={() => updateImage(currentIndex + 1)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: [{ translateY: -20 }], backgroundColor: "rgba(0, 0, 0, 0.6)", padding: 12, borderRadius: 25 }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Thumbnail List */}
        {product.images && product.images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
            style={{ backgroundColor: colors.card }}
          >
            {product.images.map((image, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => updateImage(index)}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  borderWidth: currentIndex === index ? 3 : 1,
                  borderColor: currentIndex === index ? colors.primary : colors.border,
                  overflow: "hidden",
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getFullUrl(image) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Details */}
        <View style={{ padding: 16, backgroundColor: colors.card, marginTop: 8, borderRadius: 12 }}>
          {/* Name & Status */}
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
            {product.name}
          </Text>

          {isUnavailable ? (
            <View style={{ alignSelf: "flex-start", backgroundColor: colors.error + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.error }}>
                Unavailable
              </Text>
            </View>
          ) : (
            <View style={{ alignSelf: "flex-start", backgroundColor: colors.success + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.success }}>
                Available
              </Text>
            </View>
          )}

          {/* Price */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.warning }}>
              {formatPrice(discountedPrice)}
            </Text>
            {discount > 0 && (
              <>
                <Text style={{ fontSize: 18, color: colors.textTertiary, textDecorationLine: "line-through" }}>
                  {formatPrice(finalPrice)}
                </Text>
                <View style={{ backgroundColor: colors.warning + "20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.warning }}>
                    -{discount}%
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Rating */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(rating) ? "star" : "star-outline"}
                size={20}
                color={i <= Math.round(rating) ? "#fbbf24" : colors.textTertiary}
              />
            ))}
            {ratingCount > 0 && (
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
                ({ratingCount} reviews)
              </Text>
            )}
          </View>

          {/* General Info */}
          <View style={{ marginBottom: 20, gap: 8 }}>
            {product.category && (
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, width: 100 }}>
                  Category:
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}>
                  {product.category}
                </Text>
              </View>
            )}
            {product.brand && (
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, width: 100 }}>
                  Brand:
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}>
                  {product.brand}
                </Text>
              </View>
            )}
            {product.description && (
              <View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                  Description:
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  {product.description}
                </Text>
              </View>
            )}
          </View>

          {/* Product Variants */}
          {product.variants && product.variants.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
                Product Variants
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {product.variants.map((variant, idx) => {
                  const isOutOfStock = variant.stock <= 0;
                  const isSelected = selectedVariantIndex === idx;

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => !isOutOfStock && setSelectedVariantIndex(idx)}
                      disabled={isOutOfStock}
                      style={{
                        width: (width - 64) / 3,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isOutOfStock
                          ? colors.border
                          : isSelected
                          ? colors.primary
                          : colors.border,
                        backgroundColor: isOutOfStock
                          ? colors.surface
                          : isSelected
                          ? colors.primary + "20"
                          : colors.card,
                        opacity: isOutOfStock ? 0.6 : 1,
                      }}
                      activeOpacity={0.7}
                    >
                      {variant.image && (
                        <Image
                          source={{ uri: getFullUrl(variant.image) }}
                          style={{ width: "100%", height: 60, marginBottom: 8, borderRadius: 8 }}
                          resizeMode="contain"
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: colors.text,
                          textAlign: "center",
                          marginBottom: 4,
                        }}
                        numberOfLines={1}
                      >
                        {variant.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.warning,
                          textAlign: "center",
                          marginBottom: 4,
                        }}
                      >
                        {formatPrice(variant.price)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "500",
                          color: isOutOfStock ? colors.error : colors.success,
                          textAlign: "center",
                        }}
                      >
                        {isOutOfStock ? "Out of stock" : "In stock"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {isUnavailable ? (
            <View style={{ backgroundColor: colors.error + "20", padding: 16, borderRadius: 12, marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error, textAlign: "center" }}>
                This product is no longer available
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={addingToCart}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                }}
                activeOpacity={0.8}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                    <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#fff" }}>
                      Add to Cart
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBuyNow}
                disabled={addingToCart}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.warning,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash-outline" size={20} color="#fff" />
                <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#fff" }}>
                  Buy Now
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Additional Info */}
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Shipping & Returns</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="cube-outline" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Material</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="resize-outline" size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Size</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={{ padding: 16, backgroundColor: colors.card, marginTop: 8, borderRadius: 12 }}>
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
              Product Reviews
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons
                    key={i}
                    name={i <= Math.round(rating) ? "star" : "star-outline"}
                    size={24}
                    color={i <= Math.round(rating) ? "#fbbf24" : colors.textTertiary}
                  />
                ))}
              </View>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {ratingCount} reviews
              </Text>
              {rating > 0 && (
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginLeft: 8 }}>
                  {rating} / 5
                </Text>
              )}
            </View>
          </View>

          {/* Write Review */}
          {currentUser && (
            <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, marginBottom: 12 }}>
                Write your review
              </Text>
              <View style={{ flexDirection: "row", gap: 4, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedStars(i)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={i <= selectedStars ? "star" : "star-outline"}
                      size={28}
                      color={i <= selectedStars ? "#fbbf24" : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                placeholder="Share your thoughts about the product..."
                placeholderTextColor={colors.textTertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
              <TouchableOpacity
                onPress={async () => {
                  if (!selectedStars || !comment.trim()) {
                    Toast.show({ type: "error", text1: "Please select a star rating and write a comment." });
                    return;
                  }
                  setSubmittingRating(true);
                  try {
                    const res = await rateProduct(product._id, {
                      star: selectedStars,
                      comment: comment.trim(),
                    });
                    if (res.success) {
                      Toast.show({ type: "success", text1: "Review submitted successfully!" });
                      setSelectedStars(0);
                      setComment("");
                      // Refresh product data
                      const productRes = await getProductBySlug(productSlug, shop._id);
                      if (productRes.success) {
                        setProduct(productRes.data);
                      }
                    } else {
                      Toast.show({ type: "error", text1: res.message || "Failed to submit review" });
                    }
                  } catch (error) {
                    console.error("Submit rating error:", error);
                    Toast.show({ type: "error", text1: "An error occurred while submitting review" });
                  } finally {
                    setSubmittingRating(false);
                  }
                }}
                style={{
                  alignSelf: "flex-end",
                  marginTop: 12,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 20,
                  opacity: (submittingRating || !selectedStars || !comment.trim()) ? 0.5 : 1,
                }}
                activeOpacity={0.8}
                disabled={submittingRating || !selectedStars || !comment.trim()}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {submittingRating ? "Submitting..." : "Submit Review"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reviews List */}
          <View style={{ gap: 16 }}>
            {product.ratings && product.ratings.length > 0 ? (
              product.ratings.map((review, idx) => (
                <View
                  key={idx}
                  style={{
                    paddingBottom: 16,
                    borderBottomWidth: idx < product.ratings.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Image
                        source={{ uri: getFullUrl(review.postedBy?.avatar) }}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                      />
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                        {review.postedBy?.fullName || "User"}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Ionicons
                            key={i}
                            name={i <= review.star ? "star" : "star-outline"}
                            size={16}
                            color={i <= review.star ? "#fbbf24" : colors.textTertiary}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textTertiary }}>
                      {formatDateTime(review.createdAt)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                    {review.comment}
                  </Text>
                </View>
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Ionicons name="star-outline" size={48} color={colors.textTertiary} />
                <Text style={{ fontSize: 14, color: colors.textTertiary, marginTop: 12, textAlign: "center" }}>
                  No reviews for this product yet.
                </Text>
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
                  Be the first to share your experience!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Related Products - Always at the bottom, after all reviews */}
        {relatedProducts.length > 0 && (
          <View style={{ padding: 16, backgroundColor: colors.card, marginTop: 8, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>
                Related Products
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16, gap: 16 }}
            >
              {relatedProducts.map((item) => (
                <View key={item._id} style={{ width: width * 0.45 }}>
                  <ProductCard
                    product={item}
                    shop={shop}
                    onPress={() => navigation.replace("DetailProduct", { productSlug: item.slug, shopSlug: shopSlug })}
                    colors={colors}
                    viewMode="grid"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}
