import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getNews } from "../../services/newsService";

export default function NewsScreen() {
  const navigation = useNavigation();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const result = await getNews();
      if (result && result.success) {
        const newsData = result.data;
        setNews(Array.isArray(newsData) ? newsData : []);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error("Fetch News Error:", error);
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setVisibleCount(10);
    fetchNews();
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const visibleNews = Array.isArray(news) ? news.slice(0, visibleCount) : [];
  const hasMore = Array.isArray(news) && visibleCount < news.length;

  const openNews = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {visibleNews.length > 0 ? (
          <View className="p-4">
            {visibleNews.map((item, index) => (
              <TouchableOpacity
                key={item.url || index}
                className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden"
                onPress={() => openNews(item.url)}
                activeOpacity={0.7}
              >
                {item.urlToImage && (
                  <Image
                    source={{ uri: item.urlToImage }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                )}
                <View className="p-4">
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text className="text-sm text-gray-600 mb-2" numberOfLines={3}>
                      {item.description}
                    </Text>
                  )}
                  <View className="flex-row items-center justify-between mt-2">
                    {item.source?.name && (
                      <Text className="text-xs text-gray-500">
                        {item.source.name}
                      </Text>
                    )}
                    {item.publishedAt && (
                      <Text className="text-xs text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString("vi-VN")}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {hasMore && (
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-3 px-6 items-center mt-4"
                onPress={handleLoadMore}
              >
                <Text className="text-white font-semibold">Tải thêm</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="newspaper-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-center">
              Không có tin tức
            </Text>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}

