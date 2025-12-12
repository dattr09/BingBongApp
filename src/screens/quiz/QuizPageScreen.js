import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getAllQuizzes } from "../../services/quizService";
import { API_URL } from "@env";
import { safeNavigate, useNavigationSafe } from "../../utils/navigationHelper";

// Quiz topics (simplified for mobile)
const quizTopics = [
  { id: 1, name: "All", icon: "apps" },
  { id: 2, name: "Game", icon: "game-controller" },
  { id: 3, name: "Music", icon: "musical-notes" },
  { id: 4, name: "Programming", icon: "code" },
  { id: 5, name: "Sports", icon: "football" },
  { id: 6, name: "Entertainment", icon: "film" },
];

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function QuizPageScreen() {
  const navigation = useNavigationSafe();
  const { colors } = useThemeSafe();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      if (!refreshing) setLoading(true);
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

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      // Filter by search text
      const matchSearch = searchText
        ? quiz.title?.toLowerCase().includes(searchText.toLowerCase())
        : true;

      // Filter by topic
      const matchTopic =
        selectedTopic === "All" ||
        (Array.isArray(quiz.topic) &&
          quiz.topic.some((t) =>
            t.toLowerCase().includes(selectedTopic.toLowerCase())
          ));

      return matchSearch && matchTopic;
    });
  }, [quizzes, searchText, selectedTopic]);

  if (loading && !refreshing) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View className="px-4 py-4" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text className="text-2xl font-extrabold text-center mb-2" style={{ color: '#9333EA' }}>
            🎮 Quick Quiz
          </Text>
          <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
            30 seconds to shine!
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 py-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: colors.surface }}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              className="flex-1 ml-3"
              style={{ color: colors.text }}
              placeholder="Search Quiz..."
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Topic Filter */}
        <View className="px-4 py-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {quizTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  onPress={() => setSelectedTopic(topic.name)}
                  className="px-4 py-2 rounded-full flex-row items-center gap-2"
                  style={{ backgroundColor: selectedTopic === topic.name ? colors.primary : colors.surface }}
                >
                  <Ionicons
                    name={topic.icon}
                    size={16}
                    color={selectedTopic === topic.name ? "white" : colors.textSecondary}
                  />
                  <Text
                    className="text-sm font-medium"
                    style={{ color: selectedTopic === topic.name ? "white" : colors.textSecondary }}
                  >
                    {topic.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Leaderboard Button */}
        <View className="px-4 py-3" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => {
              if (!navigation) return;
              safeNavigate(navigation, "QuizLeaderboard");
            }}
            className="rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
            style={{ backgroundColor: '#6366F1' }}
          >
            <Ionicons name="trophy" size={20} color="white" />
            <Text className="text-white font-semibold text-base">
              🏆 Leaderboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quiz List */}
        <ScrollView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          <View className="p-4">
            {filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((quiz) => (
                <View
                  key={quiz._id}
                  className="rounded-2xl p-5 mb-4 shadow-lg"
                  style={{ backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#9333EA30' }}
                >
                  {/* Title */}
                  <View className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: '#9333EA30' }}>
                    <Text className="text-lg font-bold text-center" style={{ color: '#9333EA' }}>
                      {quiz.title}
                    </Text>
                  </View>

                  {/* Description */}
                  {quiz.description && (
                    <Text
                      className="text-sm mb-3"
                      style={{ color: colors.text }}
                      numberOfLines={2}
                    >
                      {quiz.description}
                    </Text>
                  )}

                  {/* Info Row */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="time-outline" size={16} color={colors.textTertiary} />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {quiz.timeLimit || 30}s
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name="help-circle-outline"
                        size={16}
                        color={colors.textTertiary}
                      />
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        {quiz.questions?.length || 0} questions
                      </Text>
                    </View>
                    {quiz.topic && Array.isArray(quiz.topic) && quiz.topic.length > 0 && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="pricetag" size={14} color={colors.textTertiary} />
                        <Text className="text-xs" style={{ color: colors.textSecondary }} numberOfLines={1}>
                          {quiz.topic[0]}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Play Button */}
                  <TouchableOpacity
                    className="mt-4 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    style={{ backgroundColor: '#10B981' }}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!navigation) return;
                      if (!quiz._id) {
                        console.error("Quiz ID không tồn tại:", quiz);
                        return;
                      }
                      safeNavigate(navigation, "QuizPlay", { quizId: quiz._id });
                    }}
                  >
                    <Ionicons name="play" size={20} color="white" />
                    <Text className="text-white font-semibold">Play Now</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-20">
                <View className="rounded-full p-6 mb-4" style={{ backgroundColor: colors.surface }}>
                  <Ionicons name="help-circle-outline" size={64} color={colors.textTertiary} />
                </View>
                <Text className="text-center text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>
                  No quizzes found
                </Text>
                <Text className="text-center text-sm" style={{ color: colors.textTertiary }}>
                  {searchText || selectedTopic !== "All"
                    ? "Try changing filters or search keywords"
                    : "No quizzes available in the system"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
}
