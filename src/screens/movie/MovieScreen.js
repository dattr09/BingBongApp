import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getTrendingMovies, getMoviesByCategory } from "../../services/movieService";

const { width } = Dimensions.get("window");
const ORIGINAL_IMG_BASE_URL = "https://image.tmdb.org/t/p/original";
const SMALL_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

const MOVIE_CATEGORIES = [
  { key: "trending", label: "Xu hướng" },
  { key: "now_playing", label: "Đang chiếu" },
  { key: "top_rated", label: "Đánh giá cao" },
  { key: "popular", label: "Phổ biến" },
  { key: "upcoming", label: "Sắp chiếu" },
];

export default function MovieScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState("trending");
  const [movies, setMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMovies("trending");
  }, []);

  useEffect(() => {
    if (selectedCategory && !movies[selectedCategory]) {
      fetchMovies(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchMovies = async (category = "trending") => {
    try {
      let result;
      if (category === "trending") {
        result = await getTrendingMovies();
      } else {
        result = await getMoviesByCategory(category);
      }
      
      if (result && result.success) {
        const moviesData = result.data || [];
        setMovies((prev) => ({
          ...prev,
          [category]: Array.isArray(moviesData) ? moviesData : [],
        }));
      } else {
        setMovies((prev) => ({
          ...prev,
          [category]: [],
        }));
      }
    } catch (error) {
      console.error("Fetch Movies Error:", error);
      setMovies((prev) => ({
        ...prev,
        [category]: [],
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovies(selectedCategory);
  };

  const currentMovies = movies[selectedCategory] || [];

  const renderMovieItem = ({ item: movie }) => (
    <TouchableOpacity
      className="mb-4"
      onPress={() => navigation.navigate("DetailMovie", { movieId: movie.id })}
      activeOpacity={0.8}
    >
      <View className="relative bg-white rounded-xl overflow-hidden shadow-sm">
        <Image
          source={{
            uri: movie.backdrop_path
              ? `${ORIGINAL_IMG_BASE_URL}${movie.backdrop_path}`
              : movie.poster_path
              ? `${SMALL_IMG_BASE_URL}${movie.poster_path}`
              : `https://via.placeholder.com/400x225?text=${encodeURIComponent(movie.title || movie.name || '')}`,
          }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <Text className="text-white text-lg font-bold mb-1" numberOfLines={2}>
            {movie.title || movie.name}
          </Text>
          <View className="flex-row items-center gap-3">
            {movie.release_date && (
              <Text className="text-white text-sm">
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            {movie.vote_average != null && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text className="text-white text-sm">
                  {typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : String(movie.vote_average || '')}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="absolute top-4 right-4">
          <View className="bg-black/60 rounded-full p-2">
            <Ionicons name="play-circle" size={24} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !currentMovies.length) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View className="flex-1 bg-gray-50">
        {/* Category Tabs */}
        <View className="bg-white border-b border-gray-200">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-2 py-3"
          >
            {MOVIE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.key}
                className={`px-4 py-2 mx-1 rounded-full ${
                  selectedCategory === category.key
                    ? "bg-blue-600"
                    : "bg-gray-100"
                }`}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text
                  className={`font-semibold ${
                    selectedCategory === category.key
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Movies List */}
        {currentMovies.length > 0 ? (
          <FlatList
            data={currentMovies}
            renderItem={renderMovieItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              loading ? (
                <View className="py-20">
                  <SpinnerLoading />
                </View>
              ) : null
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="film-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-400 mt-4 text-center">
              Không có phim
            </Text>
          </View>
        )}
      </View>
    </MainLayout>
  );
}

