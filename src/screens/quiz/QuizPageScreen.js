import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getAllQuizzes } from "../../services/quizService";

export default function QuizPageScreen() {
  const navigation = useNavigation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const result = await getAllQuizzes();
      if (result && result.success) {
        const quizzesData = result.data;
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      } else {
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Fetch Quizzes Error:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
  };

  const filteredQuizzes = Array.isArray(quizzes) 
    ? quizzes.filter((quiz) =>
        quiz.title?.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View className="flex-1 bg-gray-50">
        {/* Search */}
        <View className="px-4 py-3 bg-white border-b border-gray-200 mb-4">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-3 text-gray-900"
            placeholder="Tìm kiếm Quiz..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz._id}
                className="bg-white rounded-xl p-4 mb-4 shadow-sm"
                onPress={() => navigation.navigate("QuizPlay", { quizId: quiz._id || quiz.id })}
                activeOpacity={0.7}
              >
                <Text className="text-lg font-bold text-gray-900 mb-2">
                  {quiz.title}
                </Text>
                {quiz.description && (
                  <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                    {quiz.description}
                  </Text>
                )}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500">
                      {quiz.timeLimit || 30}s
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="help-circle-outline" size={16} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500">
                      {quiz.questions?.length || 0} câu hỏi
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 text-center">
                Không có quiz nào
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
    </MainLayout>
  );
}

