import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getLeaderboard } from "../../services/quizService";
import { safeGoBack, safeNavigate, useNavigationSafe } from "../../utils/navigationHelper";
import { getFullUrl } from "../../utils/getPic";

const getMedalIcon = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return null;
};

const getRowColor = (index) => {
  if (index === 0)
    return { bg: "#FCD34D", text: "#1F2937" }; 
  if (index === 1)
    return { bg: "#9CA3AF", text: "#1F2937" }; 
  if (index === 2)
    return { bg: "#F59E0B", text: "#1F2937" }; 
  return { bg: index % 2 === 0 ? "#F9FAFB" : "#FFFFFF", text: "#374151" };
};

export default function QuizLeaderboardScreen() {
  const navigation = useNavigationSafe();
  const { colors } = useThemeSafe();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }

      const result = await getLeaderboard();
      if (result.success) {
        setLeaderboard(Array.isArray(result.data) ? result.data : []);
      } else {
        setLeaderboard([]);
        console.error("Fetch leaderboard failed:", result.message);
      }
    } catch (error) {
      console.error("Fetch Leaderboard Error:", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const currentUserEntry = leaderboard.find(
    (entry) => entry.user?._id === currentUser?._id
  );
  const currentUserIndex = leaderboard.findIndex(
    (entry) => entry.user?._id === currentUser?._id
  );
  const isUserInLeaderboard = currentUserIndex !== -1;

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1">
        <SpinnerLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 py-4 shadow-sm" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => {
            if (!navigation) return;
            if (!safeGoBack(navigation)) {
              safeNavigate(navigation, "Quiz");
            }
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Leaderboard
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <Text className="text-2xl font-extrabold text-center" style={{ color: colors.primary }}>
          🌟 Top Players 🌟
        </Text>
      </View>

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
          {/* Leaderboard List */}
          {leaderboard.length > 0 ? (
            <>
              {leaderboard.map((player, index) => {
                const colors = getRowColor(index);
                const medal = getMedalIcon(index);
                const isCurrentUser = player.user?._id === currentUser?._id;

                return (
                  <View
                    key={player.user?._id || index}
                    className="rounded-2xl p-4 mb-3 shadow-md border"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: isCurrentUser ? "#3B82F6" : "#E5E7EB",
                      borderWidth: isCurrentUser ? 2 : 1,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      {/* Rank */}
                      <View className="w-12 items-center">
                        {medal ? (
                          <Text className="text-3xl">{medal}</Text>
                        ) : (
                          <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                            <Text className="font-bold" style={{ color: colors.text }}>
                              {index + 1}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* User Info */}
                      <TouchableOpacity 
                        className="flex-1 flex-row items-center gap-3 mx-4"
                        onPress={() => {
                          const userId = player.user?._id;
                          if (userId && navigation) {
                            safeNavigate(navigation, "Profile", { userId });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: getFullUrl(player.user?.avatar) || "https://i.pravatar.cc/100" }}
                          className="w-12 h-12 rounded-full border-2 border-white"
                        />
                        <View className="flex-1">
                          <Text
                            className="font-semibold text-base"
                            style={{ color: colors.text }}
                            numberOfLines={1}
                          >
                            {player.user?.fullName || "Anonymous"}
                          </Text>
                          {isCurrentUser && (
                            <Text className="text-xs text-blue-600 font-medium">
                              (You)
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Score */}
                      <View className="items-end">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                          {player.totalScore || 0}
                        </Text>
                        <Text className="text-xs text-gray-500">points</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Current User Highlight (if not in top list) */}
              {!isUserInLeaderboard && currentUser && (
                <View className="mt-6 pt-6" style={{ borderTopWidth: 2, borderTopColor: colors.border }}>
                  <Text className="text-xl font-bold text-center mb-4" style={{ color: colors.text }}>
                    🏅 Your Rank
                  </Text>
                  <View className="rounded-2xl p-4" style={{ backgroundColor: colors.primary + '15', borderWidth: 2, borderColor: colors.primary }}>
                    <View className="flex-row items-center justify-between">
                      <View className="w-12 items-center">
                        <Ionicons name="person" size={24} color={colors.primary} />
                      </View>
                      <TouchableOpacity 
                        className="flex-1 flex-row items-center gap-3 mx-4"
                        onPress={() => {
                          const userId = currentUser?._id;
                          if (userId && navigation) {
                            safeNavigate(navigation, "Profile", { userId });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{
                            uri: getFullUrl(currentUser.avatar) || "https://i.pravatar.cc/100",
                          }}
                          className="w-12 h-12 rounded-full border-2"
                          style={{ borderColor: colors.card }}
                        />
                        <View className="flex-1">
                          <Text className="font-semibold text-base" style={{ color: colors.text }}>
                            {currentUser.fullName || "You"}
                          </Text>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            No score yet
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View className="items-end">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>0</Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>points</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className="items-center justify-center py-20">
              <View className="rounded-full p-6 mb-4" style={{ backgroundColor: colors.surface }}>
                <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
              </View>
              <Text className="text-center text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>
                No leaderboard yet
              </Text>
              <Text className="text-center text-sm" style={{ color: colors.textTertiary }}>
                Play quizzes to earn points and appear on the leaderboard!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
