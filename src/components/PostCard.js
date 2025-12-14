import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableHighlight,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { reactToPost } from "../services/postService";
import CommentModal from "./CommentModal";
import UserBadge from "./UserBadge";
import { useThemeSafe } from "../utils/themeHelper";
import { getFullUrl } from "../utils/getPic";

const REACTIONS = [
  { type: "Like", icon: "thumbs-up", emoji: "👍", color: "#1877F2" },
  { type: "Love", icon: "heart", emoji: "❤️", color: "#F33E58" },
  { type: "Haha", icon: "happy", emoji: "😂", color: "#F7B125" },
  { type: "Wow", icon: "flash", emoji: "😮", color: "#F7B125" },
  { type: "Sad", icon: "sad", emoji: "😢", color: "#F7B125" },
  { type: "Angry", icon: "warning", emoji: "😠", color: "#E9710F" },
  { type: "Care", icon: "heart-circle", emoji: "🤗", color: "#F7B125" },
];

export default function PostCard({ post, currentUser, onDeletePost }) {
  if (!post) return null;

  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showCommentModal, setShowCommentModal] = useState(false);

  const [reactions, setReactions] = useState(post.reactions || []);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const currentUserId = currentUser?._id || currentUser?.user?._id;
  
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = Math.min(240, screenWidth - 32);
  const menuLeft = Math.max(16, (screenWidth - menuWidth) / 2);

  const handleAvatarPress = () => {
    if (isShopPost) {
      navigation.navigate("DetailShop", { shopId: postedById._id || postedById });
    } else if (isGroupPost) {
      navigation.navigate("DetailGroup", { groupId: postedById._id || postedById });
    } else {
      const userId = author._id || postedById._id || postedById;
      if (userId) {
        navigation.navigate("Profile", { userId });
      }
    }
  };

  const handleNamePress = () => {
    handleAvatarPress();
  };
  
  // Get current user's reaction
  const myReaction = useMemo(() => {
    return reactions.find(
      (r) => r.user?._id === currentUserId || r.user === currentUserId
    );
  }, [reactions, currentUserId]);

  const [isLiked, setIsLiked] = useState(!!myReaction);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showReactionListModal, setShowReactionListModal] = useState(false);
  const longPressTimer = useRef(null);
  const reactionMenuPosition = useRef(new Animated.Value(0)).current;

  const UNDERLAY_COLOR = colors.surface;

  // Get post metadata
  const postedByType = post.postedByType || "User";
  const postedById = post.postedById || {};
  const author = post.author || {};
  
  // Determine if this is a shop/group post
  const isShopPost = postedByType === "Shop";
  const isGroupPost = postedByType === "Group";
  const isUserPost = postedByType === "User";
  
  // For shop/group posts: postedById is the shop/group, author is the user who posted
  // For user posts: postedById is the user (same as author)
  const displayEntity = isShopPost || isGroupPost ? postedById : (postedById || author);
  const displayName = isShopPost || isGroupPost 
    ? (postedById.name || postedById.fullName || "Unknown")
    : (displayEntity.fullName || displayEntity.name || "Anonymous User");
  const displayAvatar = displayEntity.avatar
    ? getFullUrl(displayEntity.avatar)
    : "https://i.pravatar.cc/150?img=3";
  
  // Author info (the person who actually posted)
  const authorName = author.fullName || author.name || "Anonymous User";
  const authorAvatar = author.avatar
    ? getFullUrl(author.avatar)
    : "https://i.pravatar.cc/150?img=3";
  
  const isMyPost = author._id === currentUserId || author === currentUserId;
  const postContent = post.content || post.description || "";
  const rawMedia = post.media || post.images || [];

  const equippedBadge = useMemo(() => {
    if (!author?.badgeInventory || !Array.isArray(author.badgeInventory)) return null;
    
    const equipped = author.badgeInventory.find(item => item.isEquipped && item.badgeId);
    if (!equipped) return null;
    
    const badgeData = equipped.badgeId;
    
    if (badgeData && typeof badgeData === 'object' && badgeData.name && badgeData.tier) {
      return badgeData;
    }
    
    return null;
  }, [author?.badgeInventory]);

  const postImages = Array.isArray(rawMedia)
    ? rawMedia
        .map((img) => {
          if (typeof img === "string") return getFullUrl(img);
          return getFullUrl(img?.url);
        })
        .filter(Boolean)
    : [];

  const handleReact = async (type) => {
    const prevReactions = [...reactions];
    const prevMyReaction = myReaction;

    let newReactions = [...reactions];
    if (prevMyReaction) {
      if (prevMyReaction.type === type) {
        newReactions = newReactions.filter(
          (r) => r.user?._id !== currentUserId && r.user !== currentUserId
        );
        setIsLiked(false);
      } else {
        newReactions = newReactions.map((r) =>
          (r.user?._id === currentUserId || r.user === currentUserId)
            ? { ...r, type }
            : r
        );
        setIsLiked(true);
      }
    } else {
      newReactions.push({ user: { _id: currentUserId }, type });
      setIsLiked(true);
    }
    setReactions(newReactions);

    const result = await reactToPost(post._id, type);
    if (!result.success) {
      setReactions(prevReactions);
      setIsLiked(!!prevMyReaction);
    } else if (result.data) {
      const updatedReactions = prevMyReaction
        ? newReactions.map((r) =>
            (r.user?._id === currentUserId || r.user === currentUserId)
              ? result.data
              : r
          )
        : [...newReactions.filter((r) => 
            r.user?._id !== currentUserId && r.user !== currentUserId
          ), result.data];
      setReactions(updatedReactions);
    }
  };

  const handleLike = () => {
    if (!showReactionMenu) {
      handleReact("Like");
    }
  };

  const handleLongPress = () => {
    setShowReactionMenu(true);
    Animated.spring(reactionMenuPosition, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      handleLongPress();
    }, 300);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Don't close menu on press out if menu is already shown
    // Menu will close when user selects a reaction or clicks outside
  };

  const closeReactionMenu = () => {
    Animated.spring(reactionMenuPosition, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowReactionMenu(false);
    });
  };


  const openImageModal = (idx) => {
    setSelectedImageIdx(idx);
    setShowImageModal(true);
  };
  const closeImageModal = () => setShowImageModal(false);
  const nextImage = () =>
    setSelectedImageIdx((prev) =>
      prev < postImages.length - 1 ? prev + 1 : 0
    );
  const prevImage = () =>
    setSelectedImageIdx((prev) =>
      prev > 0 ? prev - 1 : postImages.length - 1
    );

  const handlePostPress = () => {
    if (post._id) {
      navigation.navigate("DetailPost", { postId: post._id });
    }
  };

  const handleCommentAdded = () => {
    setCommentCount((prev) => prev + 1);
  };

  return (
    <View
      className="w-full rounded-3xl shadow-sm mb-4 overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginHorizontal: 0 }}
    >
      {/* HEADER */}
      <View
        className="flex-row items-center justify-between px-5 pt-5 pb-3"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row items-center gap-3">
          {/* Avatar - Different style for shop/group vs user */}
          {isShopPost || isGroupPost ? (
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
              <View className="relative">
                <Image
                  source={{ uri: displayAvatar }}
                  className="h-12 w-12 rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
                />
                {/* Small author avatar in bottom right corner */}
                <TouchableOpacity
                  onPress={() => {
                    const userId = author._id || author;
                    if (userId) {
                      navigation.navigate("Profile", { userId });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                    style={{ borderWidth: 2, borderColor: colors.card }}
                  >
                    <Image
                      source={{ uri: authorAvatar }}
                      className="h-full w-full rounded-full"
                      style={{ backgroundColor: colors.surface }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
              <Image
                source={{ uri: displayAvatar }}
                className="h-12 w-12 rounded-full"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              />
            </TouchableOpacity>
          )}
          <View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={handleNamePress} activeOpacity={0.7}>
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {displayName}
                </Text>
              </TouchableOpacity>
              {equippedBadge && (
                <UserBadge badge={equippedBadge} mode="mini" />
              )}
            </View>
            <View className="flex-row items-center gap-1 mt-0.5">
              {/* Show author name for shop/group posts */}
              {(isShopPost || isGroupPost) && (
                <>
                  <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                    {author._id === currentUserId ? "Bạn" : authorName}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>•</Text>
                </>
              )}
              <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Just now"}
              </Text>
              <Text className="text-xs" style={{ color: colors.textTertiary }}>•</Text>
              <Ionicons name="earth" size={12} color={colors.textTertiary} />
            </View>
          </View>
        </View>
        {isMyPost && onDeletePost ? (
          <TouchableHighlight
            underlayColor={UNDERLAY_COLOR}
            className="p-2 rounded-full"
            onPress={() => {
              Alert.alert(
                "Confirm",
                "Are you sure you want to delete this post?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDeletePost(post._id),
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableHighlight>
        ) : (
          <TouchableHighlight
            underlayColor={UNDERLAY_COLOR}
            className="p-2 rounded-full"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
          </TouchableHighlight>
        )}
      </View>

      {/* CONTENT */}
      <TouchableOpacity activeOpacity={0.95} onPress={handlePostPress}>
        {postContent ? (
          <Text className="px-5 py-2 text-base leading-6" style={{ color: colors.text }}>
            {postContent}
          </Text>
        ) : null}
      </TouchableOpacity>

      {/* IMAGES */}
      {postImages.length > 0 && (
        <TouchableOpacity activeOpacity={0.95} onPress={handlePostPress}>
          <View className="flex-row flex-wrap mt-2 px-1">
          {postImages.slice(0, 4).map((imgUrl, idx) => {
            const isSingle = postImages.length === 1;
            const widthClass = isSingle ? "w-full" : "w-1/2";
            const heightClass = isSingle ? "h-64" : "h-40";
            return (
              <TouchableHighlight
                key={idx}
                className={`${widthClass} ${heightClass} p-1`}
                underlayColor="transparent"
                onPress={(e) => {
                  e.stopPropagation();
                  openImageModal(idx);
                }}
              >
                <View className="w-full h-full overflow-hidden rounded-xl">
                  <Image
                    source={{ uri: imgUrl }}
                    className="w-full h-full"
                    style={{ 
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                    }}
                    resizeMode="cover"
                  />
                  {idx === 3 && postImages.length > 4 && (
                    <View className="absolute inset-1 bg-black/50 rounded-xl flex items-center justify-center">
                      <Text className="text-2xl font-bold text-white">
                        +{postImages.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableHighlight>
            );
          })}
          </View>
        </TouchableOpacity>
      )}

      {/* STATS */}
      <TouchableOpacity activeOpacity={0.95} onPress={handlePostPress}>
        <View className="flex-row items-center justify-between px-5 py-3 mt-1">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (reactions.length > 0) {
                setShowReactionListModal(true);
              }
            }}
            disabled={reactions.length === 0}
            activeOpacity={reactions.length > 0 ? 0.7 : 1}
            className="flex-row items-center gap-1"
          >
            {reactions.length > 0 && (
              <View className="flex-row items-center gap-1">
                {/* Show reaction icons */}
                {REACTIONS.map((reaction) => {
                  const count = reactions.filter((r) => r.type === reaction.type).length;
                  if (count === 0) return null;
                  return (
                    <View key={reaction.type} className="flex-row items-center gap-0.5">
                      <Text style={{ fontSize: 14 }}>{reaction.emoji}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
              {reactions.length} {reactions.length === 1 ? 'reaction' : 'reactions'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setShowCommentModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ACTION BUTTONS */}
      <View className="flex-row mx-2 mb-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
        <View className="flex-1 relative" style={{ zIndex: showReactionMenu ? 100 : 1 }}>
          <TouchableHighlight
            className="rounded-lg"
            underlayColor={UNDERLAY_COLOR}
            onPress={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            onPressIn={(e) => {
              e.stopPropagation();
              handlePressIn();
            }}
            onPressOut={(e) => {
              e.stopPropagation();
              handlePressOut();
            }}
            delayPressIn={0}
          >
            <View className="flex-row items-center justify-center gap-2 py-3">
              {myReaction ? (
                <>
                  <Text style={{ fontSize: 18 }}>
                    {REACTIONS.find((r) => r.type === myReaction.type)?.emoji || "👍"}
                  </Text>
                  <Text
                    className="text-sm font-medium"
                    style={{ 
                      color: REACTIONS.find((r) => r.type === myReaction.type)?.color || colors.primary 
                    }}
                  >
                    {myReaction.type}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="thumbs-up-outline"
                    size={20}
                    color={colors.textTertiary}
                  />
                  <Text
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Like
                  </Text>
                </>
              )}
            </View>
          </TouchableHighlight>

          {/* Reaction Menu */}
          {showReactionMenu && (
            <>
              <TouchableOpacity
                activeOpacity={1}
                onPress={closeReactionMenu}
                style={{
                  position: 'absolute',
                  top: -1000,
                  left: -1000,
                  right: -1000,
                  bottom: -1000,
                  zIndex: 99,
                }}
              />
              <View
                className="absolute"
                style={{ 
                  bottom: 55,
                  left: menuLeft,
                  zIndex: 100,
                  width: menuWidth,
                  alignItems: 'center',
                }}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: reactionMenuPosition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1],
                        }),
                      },
                      {
                        translateY: reactionMenuPosition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                    opacity: reactionMenuPosition,
                  }}
                >
                  <View
                    className="flex-row rounded-full"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      elevation: 15,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      width: '100%',
                      justifyContent: 'space-around',
                      minHeight: 50,
                      maxWidth: screenWidth - 32,
                    }}
                  >
                    {REACTIONS.map((reaction) => (
                      <TouchableOpacity
                        key={reaction.type}
                        onPress={() => {
                          handleReact(reaction.type);
                          closeReactionMenu();
                        }}
                        activeOpacity={0.6}
                        style={{
                          padding: 2,
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <Text style={{ fontSize: 24 }}>{reaction.emoji}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              </View>
            </>
          )}
        </View>

        <TouchableHighlight
          className="flex-1 rounded-lg"
          underlayColor={UNDERLAY_COLOR}
          onPress={(e) => {
            e.stopPropagation();
            setShowCommentModal(true);
          }}
        >
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="chatbubble-outline" size={20} color={colors.textTertiary} />
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              Comment
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          className="flex-1 rounded-lg"
          underlayColor={UNDERLAY_COLOR}
          onPress={(e) => {
            e.stopPropagation();
          }}
        >
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="share-social-outline" size={20} color={colors.textTertiary} />
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>Share</Text>
          </View>
        </TouchableHighlight>
      </View>

      {/* MODALS */}
      <Modal
        visible={showImageModal}
        transparent
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 bg-black/95 justify-center items-center relative">
          <TouchableHighlight
            onPress={closeImageModal}
            underlayColor="#333"
            className="absolute top-12 right-5 z-50 p-2 bg-gray-800/50 rounded-full"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableHighlight>
          <View className="w-full h-3/4 justify-center">
            {postImages.length > 0 && (
              <Image
                source={{ uri: postImages[selectedImageIdx] }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>
          {postImages.length > 1 && (
            <View className="absolute bottom-12 flex-row w-full justify-between px-8">
              <TouchableHighlight
                onPress={prevImage}
                underlayColor="#333"
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableHighlight>
              <TouchableHighlight
                onPress={nextImage}
                underlayColor="#333"
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-forward" size={28} color="white" />
              </TouchableHighlight>
            </View>
          )}
        </View>
      </Modal>

      <CommentModal
        visible={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        postId={post._id}
        currentUser={currentUser}
        onCommentAdded={handleCommentAdded}
      />

      {/* Reaction List Modal */}
      <Modal
        visible={showReactionListModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowReactionListModal(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4"
            style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-1 rounded-full" style={{ backgroundColor: colors.primary }} />
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>Reactions</Text>
              {reactions.length > 0 && (
                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{reactions.length}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              className="p-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
              onPress={() => setShowReactionListModal(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Reactions List */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {reactions.length === 0 ? (
              <View className="items-center justify-center mt-20">
                <View className="rounded-full p-6 mb-4" style={{ backgroundColor: colors.surface }}>
                  <Ionicons name="heart-outline" size={48} color={colors.textTertiary} />
                </View>
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  No reactions yet
                </Text>
                <Text className="text-sm text-center" style={{ color: colors.textTertiary }}>
                  Be the first to react!
                </Text>
              </View>
            ) : (
              REACTIONS.map((reactionType) => {
                const typeReactions = reactions.filter((r) => r.type === reactionType.type);
                if (typeReactions.length === 0) return null;

                return (
                  <View key={reactionType.type} className="mb-6">
                    {/* Reaction Type Header */}
                    <View className="flex-row items-center gap-2 mb-3">
                      <Text style={{ fontSize: 24 }}>{reactionType.emoji}</Text>
                      <Text className="text-lg font-bold" style={{ color: colors.text }}>
                        {reactionType.type}
                      </Text>
                      <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.surface }}>
                        <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                          {typeReactions.length}
                        </Text>
                      </View>
                    </View>

                    {/* Users List */}
                    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                      {typeReactions.map((reaction, index) => {
                        const user = reaction.user || {};
                        const userName = user.fullName || user.name || "Anonymous";
                        const userAvatar = user.avatar ? getFullUrl(user.avatar) : "https://i.pravatar.cc/150?img=3";

                        return (
                          <View
                            key={reaction._id || index}
                            className="flex-row items-center px-4 py-3"
                            style={{
                              borderBottomWidth: index < typeReactions.length - 1 ? 1 : 0,
                              borderBottomColor: colors.border,
                            }}
                          >
                            <Image
                              source={{ uri: userAvatar }}
                              className="w-12 h-12 rounded-full"
                              style={{ borderWidth: 1, borderColor: colors.border }}
                            />
                            <View className="flex-1 ml-3">
                              <Text className="text-base font-semibold" style={{ color: colors.text }}>
                                {userName}
                              </Text>
                              {user.slug && (
                                <Text className="text-xs" style={{ color: colors.textTertiary }}>
                                  @{user.slug}
                                </Text>
                              )}
                            </View>
                            <Text style={{ fontSize: 20 }}>{reactionType.emoji}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Overlay to close reaction menu */}
      {showReactionMenu && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 90,
          }}
          activeOpacity={1}
          onPress={closeReactionMenu}
        />
      )}
    </View>
  );
}
