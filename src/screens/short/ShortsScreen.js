import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Video } from "expo-av";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { getCloudinaryVideoUrl } from "../../utils/cloudinaryHelper";
import {
  getShortsFeed,
  toggleLikeShort,
  incrementViews,
} from "../../services/shortService";
import ShortCommentModal from "../../components/ShortCommentModal";
import { getUser } from "../../utils/storage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ShortsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [likedShorts, setLikedShorts] = useState(new Set());
  const [showComments, setShowComments] = useState(false);
  const [currentShortId, setCurrentShortId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const viewedShortsRef = useRef(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  useEffect(() => {
    const init = async () => {
      await loadUser();
      fetchShorts();
    };
    init();
  }, []);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      Object.keys(videoRefs.current).forEach((key) => {
        const video = videoRefs.current[key];
        if (video) {
          video.pauseAsync().catch(() => {});
        }
      });
      setPlaying(false);
    });

    return () => {
      unsubscribeBlur();
      Object.keys(videoRefs.current).forEach((key) => {
        const video = videoRefs.current[key];
        if (video) {
          video.pauseAsync().catch(() => {});
        }
      });
    };
  }, [navigation]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      const currentVideo = videoRefs.current[currentIndex];
      if (currentVideo && shorts.length > 0) {
        setTimeout(() => {
          setPlaying(true);
        }, 200);
      }
    });

    return unsubscribeFocus;
  }, [navigation, currentIndex, shorts.length]);

  useEffect(() => {
    const checkAndAddNewShort = () => {
      const state = navigation.getState();
      const route = state?.routes?.find((r) => r.name === 'Shorts');
      
      if (route?.params?.newShort) {
        const newShort = route.params.newShort;
        if (newShort && !shorts.find(s => s._id === newShort._id)) {
          setShorts(prev => [newShort, ...prev]);
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({ offset: 0, animated: false });
              setCurrentIndex(0);
              setPlaying(true);
            }
          }, 100);
          viewedShortsRef.current.clear();
        }
        navigation.setParams({ newShort: undefined });
      }
    };
    checkAndAddNewShort();
    const unsubscribe = navigation.addListener('focus', checkAndAddNewShort);

    return unsubscribe;
  }, [navigation, shorts]);

  const loadUser = async () => {
    const user = await getUser();
    setCurrentUser(user);
  };

  const fetchShorts = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const result = await getShortsFeed(pageNum, 10);
      if (result.success) {
        const newShorts = result.data || [];
        if (pageNum === 1) {
          setShorts(newShorts);
          viewedShortsRef.current.clear();
        } else {
          setShorts((prev) => [...prev, ...newShorts]);
        }
        setHasMore(
          result.pagination
            ? pageNum < result.pagination.pages
            : newShorts.length === 10
        );
      } else {
        Alert.alert("Error", result.message || "Failed to load shorts");
      }
    } catch (error) {
      console.error("Fetch shorts error:", error);
      Alert.alert("Error", "Failed to load shorts");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchShorts(nextPage);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    viewedShortsRef.current.clear();
    await fetchShorts(1);
    setRefreshing(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      setCurrentIndex(0);
      setPlaying(true);
    }
  };
  useEffect(() => {
    if (currentUser?._id && shorts.length > 0) {
      const likedSet = new Set();
      shorts.forEach((short) => {
        if (
          short.likes &&
          short.likes.some(
            (id) => id.toString() === currentUser._id.toString()
          )
        ) {
          likedSet.add(short._id);
        }
      });
      setLikedShorts(likedSet);
    }
  }, [currentUser, shorts]);

  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= shorts.length) return;

    Object.keys(videoRefs.current).forEach((key) => {
      const idx = parseInt(key);
      const video = videoRefs.current[idx];
      if (video && idx !== currentIndex) {
        video.pauseAsync().then(() => {
          video.setPositionAsync(0);
        }).catch(() => {});
      }
    });

    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      const timeoutId = setTimeout(() => {
        if (playing && currentIndex >= 0 && currentIndex < shorts.length) {
          currentVideo.setPositionAsync(0).catch(() => {});
          currentVideo.setIsMutedAsync(isMuted).catch(() => {});
          currentVideo.playAsync().catch(() => {});
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, playing, isMuted, shorts.length]);

  useEffect(() => {
    if (shorts.length > 0 && currentIndex >= 0 && currentIndex < shorts.length) {
      const shortId = shorts[currentIndex]?._id;
      if (shortId && !viewedShortsRef.current.has(shortId)) {
        viewedShortsRef.current.add(shortId);
        incrementViews(shortId).catch((error) => {
          console.error("Failed to increment views:", error);
          viewedShortsRef.current.delete(shortId);
        });
      }
    }
  }, [currentIndex, shorts]);

  const handleViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    const visibleItem = viewableItems.find(item => item.isViewable);
    
    if (visibleItem && visibleItem.index !== null && visibleItem.index !== undefined) {
      const newIndex = visibleItem.index;
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        setPlaying(true);
      }
    } else if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== null && newIndex !== undefined && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        setPlaying(true);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
    waitForInteraction: false,
  }).current;

  const togglePlayPause = () => {
    setPlaying((prev) => !prev);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    Object.keys(videoRefs.current).forEach((key) => {
      const video = videoRefs.current[key];
      if (video) {
        video.setIsMutedAsync(!isMuted);
      }
    });
  };

  const handleLike = async (short) => {
    try {
      const result = await toggleLikeShort(short._id);
      if (result.success) {
        const isLiked = result.data.isLiked;
        setLikedShorts((prev) => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.add(short._id);
          } else {
            newSet.delete(short._id);
          }
          return newSet;
        });
        setShorts((prev) =>
          prev.map((s) =>
            s._id === short._id
              ? {
                  ...s,
                  likes: isLiked
                    ? [...(s.likes || []), currentUser?._id]
                    : (s.likes || []).filter(
                        (id) => id.toString() !== currentUser?._id?.toString()
                      ),
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const openComments = (shortId) => {
    setCurrentShortId(shortId);
    setShowComments(true);
  };

  const handleCommentAdded = () => {
    setShorts((prev) =>
      prev.map((s) =>
        s._id === currentShortId
          ? { ...s, commentsCount: (s.commentsCount || 0) + 1 }
          : s
      )
    );
  };

  const getVideoUrl = (videoUrl) => {
    if (!videoUrl) return null;
    return getCloudinaryVideoUrl(videoUrl);
  };

  const renderShort = ({ item: short, index }) => {
    const isLiked = likedShorts.has(short._id) || 
      (short.likes || []).some(
        (id) => id.toString() === currentUser?._id?.toString()
      );
    const videoUrl = getVideoUrl(short.videoUrl);
    const user = short.user || {};
    const isCurrentVideo = index === currentIndex;
    const shouldPlay = isCurrentVideo && playing;

    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: "#000",
        }}
      >
        {/* Video Player */}
        {videoUrl ? (
          <>
            <TouchableOpacity
              activeOpacity={1}
              onPress={togglePlayPause}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
              }}
            >
              <Video
                ref={(ref) => {
                  videoRefs.current[index] = ref;
                }}
                source={{ uri: videoUrl }}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT,
                }}
                resizeMode="cover"
                shouldPlay={shouldPlay}
                isLooping
                isMuted={isMuted}
                useNativeControls={false}
                onLoad={() => {
                  if (videoRefs.current[index]) {
                    videoRefs.current[index].setIsMutedAsync(isMuted);
                    if (index !== currentIndex) {
                      videoRefs.current[index].pauseAsync().then(() => {
                        videoRefs.current[index].setPositionAsync(0);
                      }).catch(() => {});
                    }
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isPlaying && index !== currentIndex) {
                    videoRefs.current[index]?.pauseAsync().then(() => {
                      videoRefs.current[index]?.setPositionAsync(0);
                    }).catch(() => {});
                  }
                }}
              />
            </TouchableOpacity>

            {/* Play/Pause Overlay - Chỉ hiện khi video pause */}
            {!playing && isCurrentVideo && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={togglePlayPause}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 30,
                    padding: 12,
                  }}
                >
                  <Ionicons name="play" size={36} color="#000" />
                </View>
              </TouchableOpacity>
            )}

          </>
        ) : (
          <View
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Bottom Info */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: 20,
            paddingHorizontal: 16,
          }}
        >
          {/* User Info */}
          <TouchableOpacity
            onPress={() => {
              if (user.slug) {
                navigation.navigate("Profile", { userId: user._id });
              }
            }}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
          >
            <Image
              source={{
                uri: getFullUrl(user.avatar) || "https://i.pravatar.cc/300?img=1",
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "#fff",
                marginRight: 12,
              }}
            />
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  {user.fullName || "User"}
                </Text>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: 12,
                  }}
                >
                  @{user.slug || "user"}
                </Text>
              </View>
              
              {/* Volume Control - Nằm kế bên tên */}
              <TouchableOpacity
                onPress={toggleMute}
                style={{
                  marginLeft: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Caption */}
          {short.caption && (
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                marginBottom: 8,
                maxWidth: SCREEN_WIDTH - 80,
              }}
              numberOfLines={2}
            >
              {short.caption}
            </Text>
          )}

          {/* Hashtags */}
          {short.hashtags && short.hashtags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4, marginBottom: 8 }}>
              {short.hashtags.map((tag, idx) => (
                <Text
                  key={idx}
                  style={{
                    color: "#60A5FA",
                    fontSize: 12,
                    marginRight: 8,
                  }}
                >
                  #{tag}
                </Text>
              ))}
            </View>
          )}

          {/* Music */}
          {short.music && (short.music.name || short.music.artist) && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 8 }}>
              <Ionicons name="musical-notes-outline" size={12} color="rgba(255, 255, 255, 0.8)" />
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 12,
                  marginLeft: 4,
                }}
                numberOfLines={1}
              >
                {short.music.name}
                {short.music.artist && ` - ${short.music.artist}`}
              </Text>
            </View>
          )}

        </View>

        {/* Right Side Actions */}
        <View
          style={{
            position: "absolute",
            right: 12,
            bottom: 40,
            alignItems: "center",
            gap: 18,
          }}
        >
          {/* Like Button */}
          <TouchableOpacity
            onPress={() => handleLike(short)}
            style={{ alignItems: "center" }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 0, 0, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#EF4444" : "#fff"}
              />
            </View>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              {formatNumber((short.likes || []).length)}
            </Text>
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            onPress={() => openComments(short._id)}
            style={{ alignItems: "center" }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              {formatNumber(short.commentsCount || 0)}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={{ alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Views Button */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 3,
              }}
            >
              <Ionicons name="eye-outline" size={22} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              {formatNumber(short.views || 0)}
            </Text>
          </View>

        </View>
      </View>
    );
  };

  if (loading && shorts.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  if (shorts.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          No shorts available
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateShort")}
          style={{
            backgroundColor: "#3B82F6",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Create First Short
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={[]}>
      {/* Header */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: 50,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "bold",
          }}
        >
          Shorts
        </Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("MyShorts")}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateShort")}
            style={{
              backgroundColor: "#3B82F6",
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Feed */}
      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={renderShort}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate={0.99}
        disableIntervalMomentum={true}
        disableScrollViewPanResponder={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={["#fff"]}
            progressViewOffset={50}
            progressBackgroundColor="transparent"
            size="large"
          />
        }
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Comments Modal */}
      <ShortCommentModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        shortId={currentShortId}
        currentUser={currentUser}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}
