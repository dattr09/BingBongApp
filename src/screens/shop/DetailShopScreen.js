import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getShopBySlug, followShop, unfollowShop, updateShopInfo } from "../../services/shopService";
import { getProductsByShop } from "../../services/productService";
import { getShopPosts } from "../../services/postService";
import { getChatIdByTypeId } from "../../services/chatService";
import { getUser } from "../../utils/storage";
import { getFullUrl } from "../../utils/getPic";
import { uploadAvatar, uploadCoverPhoto } from "../../services/profileService";
import ProductCard from "../../components/ProductCard";
import PostCard from "../../components/PostCard";
import CreatePostModal from "../../components/CreatePostModal";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function DetailShopScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { shopSlug } = route.params || {};
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);
  const [showEditShopModal, setShowEditShopModal] = useState(false);
  const [editingShop, setEditingShop] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchShop = async () => {
      if (!shopSlug) return;
      setLoading(true);
      try {
        const res = await getShopBySlug(shopSlug);
        if (res.success) {
          setShop(res.data);
          setIsFollowing(res.data.followers?.includes(currentUser?._id) || false);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopSlug, currentUser?._id]);

  useEffect(() => {
    if (shop && activeTab === "products") {
      fetchProducts();
    }
  }, [shop, activeTab]);

  useEffect(() => {
    if (shop && (activeTab === "posts" || activeTab === "photos")) {
      fetchPosts();
    }
  }, [shop, activeTab]);

  const fetchProducts = async () => {
    if (!shop?._id) return;
    setProductsLoading(true);
    try {
      const res = await getProductsByShop(shop._id);
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (error) {
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!shop?._id) return;
    setPostsLoading(true);
    try {
      const res = await getShopPosts(shop._id);
      if (res.success) {
        setPosts(res.data || []);
      }
    } catch (error) {
    } finally {
      setPostsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === "products") {
      await fetchProducts();
    } else if (activeTab === "posts") {
      await fetchPosts();
    }
    setRefreshing(false);
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      Toast.show({ type: "error", text1: "Please login first!" });
      return;
    }

    const previous = isFollowing;
    setIsFollowing(!previous);

    try {
      const response = previous
        ? await unfollowShop(shop._id)
        : await followShop(shop._id);

      if (!response.success) {
        setIsFollowing(previous);
        Toast.show({ type: "error", text1: response.message || "Failed to update follow status" });
      } else {
        setShop((prev) => ({
          ...prev,
          followers: previous
            ? prev.followers.filter((id) => id !== currentUser._id)
            : [...prev.followers, currentUser._id],
        }));
        Toast.show({ type: "success", text1: previous ? "Unfollowed shop" : "Following shop" });
      }
    } catch (error) {
      setIsFollowing(previous);
      Toast.show({ type: "error", text1: "An error occurred" });
    }
  };

  const handleMessage = async () => {
    if (!shop?._id) return;
    try {
      const response = await getChatIdByTypeId({
        shopId: shop._id,
        type: "shop",
      });
      if (response.success && response.data) {
        navigation.navigate("Chat", {
          shopChat: shop,
          chatType: "shop",
          chatId: response.data._id,
        });
      } else {
        Toast.show({ type: "error", text1: response.message || "Failed to open chat" });
      }
    } catch (error) {
      console.error("Chat error:", error);
      Toast.show({ type: "error", text1: "An error occurred while opening chat" });
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate("DetailProduct", {
      productSlug: product.slug,
      shopSlug: shop.slug,
    });
  };

  const handleUploadAvatar = async () => {
    if (!isMyShop || !shop?._id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "App needs access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const uploadResult = await uploadAvatar(
          result.assets[0].uri,
          "Shop",
          shop._id
        );
        if (uploadResult.success) {
          setShop((prev) => ({
            ...prev,
            avatar: uploadResult.data?.avatar || uploadResult.data,
          }));
          Toast.show({ type: "success", text1: "Avatar updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Failed to update avatar" });
        }
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCoverPhoto = async () => {
    if (!isMyShop || !shop?._id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "App needs access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingCoverPhoto(true);
        const uploadResult = await uploadCoverPhoto(
          result.assets[0].uri,
          "Shop",
          shop._id
        );
        if (uploadResult.success) {
          setShop((prev) => ({
            ...prev,
            coverPhoto: uploadResult.data?.coverPhoto || uploadResult.data,
          }));
          Toast.show({ type: "success", text1: "Cover photo updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Failed to update cover photo" });
        }
      }
    } catch (error) {
      console.error("Upload cover photo error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingCoverPhoto(false);
    }
  };

  const handleSaveShopInfo = async (formData) => {
    if (!shop?._id) return;
    setEditingShop(true);
    try {
      const updatedShop = {
        name: formData.name,
        description: {
          about: formData.about,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
        },
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        mainCategory: formData.mainCategory,
        socials: formData.socials,
        status: formData.status,
        mapURL: formData.mapURL,
      };
      const res = await updateShopInfo(shop._id, updatedShop);
      if (res.success) {
        setShop((prev) => ({ ...prev, ...res.data?.shop || res.data }));
        setShowEditShopModal(false);
        Toast.show({ type: "success", text1: "Shop information updated successfully!" });
      } else {
        Toast.show({ type: "error", text1: res.message || "Failed to update shop information" });
      }
    } catch (error) {
      console.error("Update shop info error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setEditingShop(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter(
        (p) => p.category && p.category === selectedCategory.name
      );
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min) && min > 0) {
        result = result.filter((p) => {
          const price = p.variants?.[0]?.price || p.basePrice || 0;
          return price >= min;
        });
      }
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max) && max > 0) {
        result = result.filter((p) => {
          const price = p.variants?.[0]?.price || p.basePrice || 0;
          return price <= max;
        });
      }
    }

    if (isDiscounted) {
      result = result.filter((p) => p.discount > 0);
    }

    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(search));
    }

    return result;
  }, [products, selectedCategory, minPrice, maxPrice, isDiscounted, searchTerm]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!shop) {
    return (
      <MainLayout>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Shop not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isMyShop = currentUser && shop.owner?._id === currentUser._id;

  const renderHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      {/* Cover Photo */}
      <View style={{ height: 220, width: "100%", position: "relative" }}>
        <Image
          source={{ uri: getFullUrl(shop.coverPhoto) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)" }} />
        {isMyShop && (
          <TouchableOpacity
            onPress={handleUploadCoverPhoto}
            disabled={uploadingCoverPhoto}
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              gap: 6,
            }}
            activeOpacity={0.8}
          >
            {uploadingCoverPhoto ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="camera" size={16} color={colors.text} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                  Change cover
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar and Info Card */}
      <View style={{ marginTop: 16, marginHorizontal: 16, padding: 16, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: getFullUrl(shop.avatar) }}
              style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: colors.card }}
            />
            {isMyShop && (
              <TouchableOpacity
                onPress={handleUploadAvatar}
                disabled={uploadingAvatar}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: colors.card,
                }}
                activeOpacity={0.8}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={{ marginLeft: 16, flex: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text, marginBottom: 4 }}>
              {shop.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>
                {shop.followers?.length || 0} followers
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 20, flexDirection: "row", gap: 10 }}>
        {!isMyShop && (
          <>
            <TouchableOpacity
              onPress={handleFollowToggle}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: 10,
                backgroundColor: isFollowing ? colors.surface : colors.primary,
                shadowColor: isFollowing ? "#000" : colors.primary,
                shadowOffset: { width: 0, height: isFollowing ? 1 : 2 },
                shadowOpacity: isFollowing ? 0.1 : 0.3,
                shadowRadius: isFollowing ? 2 : 4,
                elevation: isFollowing ? 2 : 3,
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFollowing ? "checkmark-circle" : "add-circle"}
                size={22}
                color={isFollowing ? colors.text : "#fff"}
              />
              <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: isFollowing ? colors.text : "#fff" }}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            {isFollowing && (
              <TouchableOpacity
                onPress={handleMessage}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: colors.surface,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
                <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: colors.text }}>
                  Message
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
          {["posts", "products", "about", "photos"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ paddingBottom: 14, paddingHorizontal: 18, marginRight: 8, borderBottomWidth: activeTab === tab ? 3 : 0, borderBottomColor: activeTab === tab ? colors.primary : "transparent" }}
              activeOpacity={0.7}
            >
              <Text style={{ fontWeight: activeTab === tab ? "600" : "500", fontSize: 15, color: activeTab === tab ? colors.primary : colors.textSecondary }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderProductsTab = () => (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Filter Bar */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        {/* Category Filter */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, backgroundColor: !selectedCategory ? colors.primary : colors.surface }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, fontWeight: "500", color: !selectedCategory ? "#fff" : colors.text }}>
                All
              </Text>
            </TouchableOpacity>
            {shop.categories?.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => setSelectedCategory(cat)}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginRight: 8, backgroundColor: selectedCategory?._id === cat._id ? colors.primary : colors.surface }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 13, fontWeight: "500", color: selectedCategory?._id === cat._id ? "#fff" : colors.text }}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search */}
        <View style={{ position: "relative", marginBottom: 12 }}>
          <Ionicons name="search-outline" size={20} color={colors.textTertiary} style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{ borderRadius: 10, paddingLeft: 40, paddingRight: 16, paddingVertical: 12, fontSize: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
          />
        </View>

        {/* Price Filter */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>Price:</Text>
          <TextInput
            placeholder="Min"
            placeholderTextColor={colors.textTertiary}
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            style={{ flex: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
          />
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>-</Text>
          <TextInput
            placeholder="Max"
            placeholderTextColor={colors.textTertiary}
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            style={{ flex: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
          />
        </View>

        {/* Discount Filter */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => setIsDiscounted(!isDiscounted)}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            activeOpacity={0.7}
          >
            <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: isDiscounted ? colors.primary : "transparent" }}>
              {isDiscounted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={{ fontSize: 14, color: colors.text }}>Discounted only</Text>
          </TouchableOpacity>

          {/* View Mode Toggle */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setViewMode("grid")}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: viewMode === "grid" ? colors.primary : colors.border,
                backgroundColor: viewMode === "grid" ? colors.primary : colors.surface,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={viewMode === "grid" ? "#fff" : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("list")}
              style={{
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: viewMode === "list" ? colors.primary : colors.border,
                backgroundColor: viewMode === "list" ? colors.primary : colors.surface,
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={viewMode === "list" ? "#fff" : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products List */}
      {productsLoading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <SpinnerLoading />
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              shop={shop}
              onPress={() => handleProductPress(item)}
              colors={colors}
              viewMode={viewMode}
            />
          )}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? { justifyContent: "space-between" } : undefined}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
          <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
            No products found
          </Text>
        </View>
      )}
    </View>
  );

  const handlePostCreated = (newPost) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev]);
    } else {
      fetchPosts();
    }
  };

  const renderPostsTab = () => (
    <View style={{ paddingHorizontal: 0 }}>
      {/* Create Post Button - Only for shop owner */}
      {isMyShop && currentUser && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setShowCreatePostModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: getFullUrl(shop.avatar) }}
              style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                What's new in your shop, {shop.name}?
              </Text>
            </View>
            <Ionicons name="images-outline" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

      {postsLoading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <SpinnerLoading />
        </View>
      ) : posts.length > 0 ? (
        <View style={{ gap: 16 }}>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={currentUser}
              onDeletePost={() => {
                setPosts(posts.filter((p) => p._id !== post._id));
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
          <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
            No posts available
          </Text>
        </View>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onPostCreated={handlePostCreated}
        user={currentUser}
        postedByType="Shop"
        postedById={shop._id}
        postedBy={{
          _id: shop._id,
          name: shop.name,
          avatar: shop.avatar,
          slug: shop.slug,
        }}
      />
    </View>
  );

  const renderPhotosTab = () => {
    const allPhotos = [];
    posts.forEach((post) => {
      if (post.media && post.media.length > 0) {
        post.media.forEach((img) => {
          allPhotos.push({ image: img, postId: post._id });
        });
      }
    });

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {postsLoading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <SpinnerLoading />
          </View>
        ) : allPhotos.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {allPhotos.map((photo, index) => (
              <TouchableOpacity
                key={`${photo.postId}-${index}`}
                onPress={() => {
                  navigation.navigate("PostDetail", { postId: photo.postId });
                }}
                style={{
                  width: (width - 48) / 3,
                  height: (width - 48) / 3,
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getFullUrl(photo.image) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
              No photos available
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderAboutTab = () => {
    const {
      description = {},
      openTime = "08:00",
      closeTime = "21:00",
      socials = {},
      mapURL,
      status,
      mainCategory,
    } = shop || {};

    const now = new Date();
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const isOpen =
      now.getHours() > openH && now.getHours() < closeH
        ? true
        : now.getHours() === openH
          ? now.getMinutes() >= openM
          : now.getHours() === closeH
            ? now.getMinutes() <= closeM
            : false;

    const statusColor = {
      open: { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e" },
      closed: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" },
      maintenance: { bg: "rgba(234, 179, 8, 0.1)", text: "#eab308" },
    };
    const currentStatus = statusColor[status] || statusColor.open;

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {/* About Section */}
        <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
              About
            </Text>
            {isMyShop && (
              <TouchableOpacity
                onPress={() => setShowEditShopModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  gap: 6,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Shop Status */}
          <View style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: currentStatus.bg, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "500", color: currentStatus.text }}>
              {status === "open" ? "Open" : status === "closed" ? "Closed" : "Maintenance"}
            </Text>
          </View>

          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: 12 }}>
            {description.about || description || "No description available"}
          </Text>

          {/* Main Category */}
          {mainCategory && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textTertiary} />
              <Text style={{ marginLeft: 8, fontSize: 14, color: colors.textSecondary }}>
                Specializes in {mainCategory}
              </Text>
            </View>
          )}
        </View>

        {/* Contact Information & Opening Hours */}
        <View style={{ flexDirection: "column", gap: 16, marginBottom: 16 }}>
          {/* Contact Info */}
          <View style={{ borderRadius: 12, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
              Contact Information
            </Text>
            {description.address && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name="location-outline" size={18} color={colors.textTertiary} />
                <Text style={{ marginLeft: 12, fontSize: 15, color: colors.text, flex: 1 }}>
                  {description.address}
                </Text>
              </View>
            )}
            {description.phone && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name="call-outline" size={18} color={colors.textTertiary} />
                <Text style={{ marginLeft: 12, fontSize: 15, color: colors.primary }}>
                  {description.phone}
                </Text>
              </View>
            )}
            {description.email && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                <Text style={{ marginLeft: 12, fontSize: 15, color: colors.primary }}>
                  {description.email}
                </Text>
              </View>
            )}
            {description.website && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="globe-outline" size={18} color={colors.textTertiary} />
                <Text style={{ marginLeft: 12, fontSize: 15, color: colors.primary }}>
                  {description.website}
                </Text>
              </View>
            )}
          </View>

          {/* Opening Hours */}
          <View style={{ borderRadius: 12, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
              Opening Hours
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="time-outline" size={18} color={colors.textTertiary} />
              <Text style={{ marginLeft: 12, fontSize: 15, color: colors.text }}>
                {openTime} - {closeTime}
              </Text>
            </View>
            <View style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isOpen ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)" }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: isOpen ? "#22c55e" : "#ef4444" }}>
                {isOpen ? "Open Now" : "Closed"}
              </Text>
            </View>
          </View>
        </View>

        {/* Social Media */}
        {(socials.facebook || socials.instagram || socials.tiktok || socials.youtube) && (
          <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
              Social Media
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {socials.facebook && (
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
                  <Ionicons name="logo-facebook" size={18} color="#1877f2" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: colors.text }}>Facebook</Text>
                </View>
              )}
              {socials.instagram && (
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
                  <Ionicons name="logo-instagram" size={18} color="#e4405f" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: colors.text }}>Instagram</Text>
                </View>
              )}
              {socials.youtube && (
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface }}>
                  <Ionicons name="logo-youtube" size={18} color="#ff0000" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: colors.text }}>YouTube</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Google Map */}
        {mapURL && (
          <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 12 }}>
              Map
            </Text>
            <View style={{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ height: 300 }}
              >
                <View style={{ width: width - 64, height: 300 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, padding: 16, textAlign: "center" }}>
                    Map view available on web version
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <MainLayout disableScroll={true}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {activeTab === "products" ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderProductsTab}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            showsVerticalScrollIndicator={false}
          />
        ) : activeTab === "posts" ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderPostsTab}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            showsVerticalScrollIndicator={false}
          />
        ) : activeTab === "photos" ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderPhotosTab}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {renderHeader()}
            {renderAboutTab()}
          </ScrollView>
        )}

        {/* Edit Shop Info Modal */}
        <Modal
          visible={showEditShopModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowEditShopModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, width: "100%", maxHeight: "80%", padding: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>
                  Edit Shop Information
                </Text>
                <TouchableOpacity onPress={() => setShowEditShopModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <EditShopInfoForm
                shop={shop}
                onSave={handleSaveShopInfo}
                onCancel={() => setShowEditShopModal(false)}
                colors={colors}
                loading={editingShop}
              />
            </View>
          </View>
        </Modal>
      </View>
    </MainLayout>
  );
}

const EditShopInfoForm = ({ shop, onSave, onCancel, colors, loading }) => {
  const [formData, setFormData] = useState({
    name: shop?.name || "",
    about: shop?.description?.about || "",
    address: shop?.description?.address || "",
    phone: shop?.description?.phone || "",
    email: shop?.description?.email || "",
    website: shop?.description?.website || "",
    openTime: shop?.openTime || "08:00",
    closeTime: shop?.closeTime || "21:00",
    mainCategory: shop?.mainCategory || "Other",
    status: shop?.status || "open",
    mapURL: shop?.mapURL || "",
    socials: {
      facebook: shop?.socials?.facebook || "",
      instagram: shop?.socials?.instagram || "",
      youtube: shop?.socials?.youtube || "",
      tiktok: shop?.socials?.tiktok || "",
    },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value },
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
      <View style={{ gap: 16 }}>
        {/* Name */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
            Name
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={(value) => handleChange("name", value)}
            style={{
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
            }}
          />
        </View>

        {/* About */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
            About
          </Text>
          <TextInput
            value={formData.about}
            onChangeText={(value) => handleChange("about", value)}
            multiline
            numberOfLines={4}
            style={{
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
              minHeight: 100,
            }}
            placeholder="Brief description about the shop..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Address & Contact */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Address
            </Text>
            <TextInput
              value={formData.address}
              onChangeText={(value) => handleChange("address", value)}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Phone
            </Text>
            <TextInput
              value={formData.phone}
              onChangeText={(value) => handleChange("phone", value)}
              keyboardType="phone-pad"
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Website
            </Text>
            <TextInput
              value={formData.website}
              onChangeText={(value) => handleChange("website", value)}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>
        </View>

        {/* Map URL */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
            Google Maps Link
          </Text>
          <TextInput
            value={formData.mapURL}
            onChangeText={(value) => handleChange("mapURL", value)}
            style={{
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.text,
            }}
            placeholder="Paste iframe or share link of the map..."
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Open/Close Time */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Opening Time
            </Text>
            <TextInput
              value={formData.openTime}
              onChangeText={(value) => handleChange("openTime", value)}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="08:00"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Closing Time
            </Text>
            <TextInput
              value={formData.closeTime}
              onChangeText={(value) => handleChange("closeTime", value)}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="21:00"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Category & Status */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Main Category
            </Text>
            <TextInput
              value={formData.mainCategory}
              onChangeText={(value) => handleChange("mainCategory", value)}
              style={{
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
              placeholder="E.g.: Fashion, Food..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 8 }}>
              Status
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {["open", "closed", "maintenance"].map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleChange("status", status)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: formData.status === status ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: formData.status === status ? colors.primary : colors.border,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "500", color: formData.status === status ? "#fff" : colors.text }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Social Media */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, marginBottom: 12 }}>
            Social Media
          </Text>
          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                Facebook
              </Text>
              <TextInput
                value={formData.socials.facebook}
                onChangeText={(value) => handleSocialChange("facebook", value)}
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                Instagram
              </Text>
              <TextInput
                value={formData.socials.instagram}
                onChangeText={(value) => handleSocialChange("instagram", value)}
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                YouTube
              </Text>
              <TextInput
                value={formData.socials.youtube}
                onChangeText={(value) => handleSocialChange("youtube", value)}
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
                TikTok
              </Text>
              <TextInput
                value={formData.socials.tiktok}
                onChangeText={(value) => handleSocialChange("tiktok", value)}
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 10,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 10,
              backgroundColor: loading ? colors.surface : colors.primary,
              alignItems: "center",
              opacity: loading ? 0.5 : 1,
            }}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
