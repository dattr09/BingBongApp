import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import SpinnerLoading from "../../components/SpinnerLoading";
import MainLayout from "../../components/MainLayout";
import { useThemeSafe } from "../../utils/themeHelper";
import { getMovieDetail, getMovieTrailer, getSimilarMovies, getMovieCredit } from "../../services/movieService";

const { width } = Dimensions.get("window");
const ORIGINAL_IMG_BASE_URL = "https://image.tmdb.org/t/p/original";
const SMALL_IMG_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function DetailMovieScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const { movieId } = route.params || {};

  const [movie, setMovie] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (movieId) {
      fetchMovieDetail();
    } else {
      setError("No movie ID");
      setLoading(false);
    }
  }, [movieId]);

  const fetchMovieDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [detailResult, similarResult, trailerResult, creditResult] = await Promise.allSettled([
        getMovieDetail(movieId),
        getSimilarMovies(movieId),
        getMovieTrailer(movieId),
        getMovieCredit(movieId),
      ]);

      if (detailResult.status === "fulfilled" && detailResult.value.success) {
        setMovie(detailResult.value.data);
      } else {
        setError("Unable to load movie information");
      }

      if (similarResult.status === "fulfilled" && similarResult.value.success) {
        setSimilarMovies(similarResult.value.data || []);
      }

      if (trailerResult.status === "fulfilled" && trailerResult.value.success) {
        setTrailers(trailerResult.value.data || []);
      }

      if (creditResult.status === "fulfilled" && creditResult.value.success) {
        setCredits(creditResult.value.data);
      }
    } catch (error) {
      console.error("Fetch Movie Detail Error:", error);
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const openTrailer = (trailer) => {
    if (trailer?.key) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      Linking.openURL(youtubeUrl).catch((err) => {
        Alert.alert("Error", "Unable to open trailer");
        console.error("Failed to open URL:", err);
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (error || !movie) {
    return (
      <MainLayout>
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text className="text-center text-lg mt-4" style={{ color: colors.textSecondary }}>
            {error || "Movie not found"}
          </Text>
          <TouchableOpacity
            className="mt-4 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  const cast = credits?.cast || [];
  const crew = credits?.crew || [];
  const director = crew.find((person) => person.job === "Director");
  const youtubeTrailers = trailers.filter((t) => t.site === "YouTube" && t.type === "Trailer");

  return (
    <MainLayout disableScroll={true}>
      <ScrollView className="flex-1 bg-black" showsVerticalScrollIndicator={false}>
        {/* Backdrop Image with Header */}
        <View className="relative">
          {movie.backdrop_path && (
            <Image
              source={{
                uri: `${ORIGINAL_IMG_BASE_URL}${movie.backdrop_path}`,
              }}
              className="w-full h-80"
              resizeMode="cover"
            />
          )}
          <View className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
          
          {/* Back Button */}
          <TouchableOpacity
            className="absolute top-12 left-4 z-10 bg-black/50 rounded-full p-2"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Play Trailer Button */}
          {youtubeTrailers.length > 0 && (
            <TouchableOpacity
              className="absolute bottom-4 left-4 right-4 bg-red-600 rounded-lg py-3 px-6 flex-row items-center justify-center"
              onPress={() => openTrailer(youtubeTrailers[0])}
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text className="text-white font-bold ml-2">Xem Trailer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View className="p-4 bg-black">
          {/* Title */}
          <Text className="text-2xl font-bold text-white mb-2">
            {movie.title || movie.name}
          </Text>

          {/* Info */}
          <View className="flex-row items-center flex-wrap gap-3 mb-4">
            {movie.release_date && (
              <Text className="text-gray-400">
                {new Date(movie.release_date).getFullYear()}
              </Text>
            )}
            {movie.adult !== undefined && (
              <View className="bg-gray-700 px-2 py-1 rounded">
                <Text className="text-white text-xs">
                  {movie.adult ? "18+" : "PG-13"}
                </Text>
              </View>
            )}
            {movie.vote_average != null && (
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text className="text-white">
                  {typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : String(movie.vote_average || '')}
                </Text>
              </View>
            )}
            {movie.runtime && (
              <Text className="text-gray-400">
                {typeof movie.runtime === 'number' ? `${movie.runtime} phút` : String(movie.runtime || '')}
              </Text>
            )}
            {movie.genres && movie.genres.length > 0 && (
              <Text className="text-gray-400">
                {movie.genres[0]?.name}
              </Text>
            )}
          </View>

          {/* Overview */}
          {movie.overview && (
            <View className="mb-4">
              <Text className="text-white text-base leading-6">
                {movie.overview}
              </Text>
            </View>
          )}

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Thể loại</Text>
              <View className="flex-row flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <View
                    key={genre.id}
                    className="bg-gray-800 px-3 py-1 rounded-full"
                  >
                    <Text className="text-white text-sm">{genre.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Director */}
          {director && (
            <View className="mb-4">
              <Text className="text-white font-semibold mb-2">Đạo diễn</Text>
              <Text className="text-gray-300">{director.name}</Text>
            </View>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-semibold mb-3 text-lg">Diễn viên</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cast.slice(0, 10).map((actor) => (
                  <View key={actor.id} className="mr-4 items-center" style={{ width: 100 }}>
                    {actor.profile_path ? (
                      <Image
                        source={{
                          uri: `${SMALL_IMG_BASE_URL}${actor.profile_path}`,
                        }}
                        className="w-20 h-20 rounded-full mb-2"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-gray-700 items-center justify-center mb-2">
                        <Ionicons name="person" size={32} color="#9CA3AF" />
                      </View>
                    )}
                    <Text className="text-white text-xs text-center" numberOfLines={2}>
                      {actor.name}
                    </Text>
                    {actor.character && (
                      <Text className="text-gray-400 text-xs text-center" numberOfLines={1}>
                        {actor.character}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Trailers */}
          {youtubeTrailers.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-semibold mb-3 text-lg">Trailer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {youtubeTrailers.slice(0, 5).map((trailer, index) => (
                  <TouchableOpacity
                    key={trailer.id || index}
                    className="mr-4"
                    onPress={() => openTrailer(trailer)}
                  >
                    <View className="bg-gray-800 rounded-lg p-4 items-center justify-center" style={{ width: 200, height: 120 }}>
                      <Ionicons name="play-circle" size={48} color="#fff" />
                      <Text className="text-white text-sm mt-2 text-center" numberOfLines={2}>
                        {trailer.name || "Trailer"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Similar Movies */}
          {similarMovies.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-semibold mb-3 text-lg">
                Phim tương tự
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {similarMovies.slice(0, 10).map((similar) => (
                  <TouchableOpacity
                    key={similar.id}
                    className="mr-4"
                    onPress={() => {
                      navigation.replace("DetailMovie", {
                        movieId: similar.id,
                      });
                    }}
                  >
                    <Image
                      source={{
                        uri: similar.poster_path
                          ? `${SMALL_IMG_BASE_URL}${similar.poster_path}`
                          : `https://via.placeholder.com/150x225?text=${encodeURIComponent(similar.title || similar.name || '')}`,
                      }}
                      className="w-32 h-48 rounded-lg"
                      resizeMode="cover"
                    />
                    <Text
                      className="text-white text-sm mt-2 w-32"
                      numberOfLines={2}
                    >
                      {similar.title || similar.name || 'No title'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

