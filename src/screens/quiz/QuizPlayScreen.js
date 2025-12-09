import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, useIsFocused, CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getQuizById, submitQuizScore } from "../../services/quizService";

export default function QuizPlayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const isFocused = useIsFocused();
  const { quizId } = route.params || {};
  const isMountedRef = useRef(true);

  const [quiz, setQuiz] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe navigation helper - chỉ gọi khi screen đang focused và mounted
  const safeGoBack = useCallback(() => {
    // Chỉ thực hiện navigation khi screen đang focused và mounted
    if (!isFocused || !isMountedRef.current) {
      return;
    }
    
    // Sử dụng InteractionManager để đảm bảo navigation được gọi sau khi interactions hoàn tất
    InteractionManager.runAfterInteractions(() => {
      // Double check sau khi interactions hoàn tất
      if (!isMountedRef.current || !isFocused) {
        return;
      }
      
      try {
        // Kiểm tra navigation object có tồn tại không
        if (!navigation) {
          console.warn("Navigation object not available");
          return;
        }
        
        // Kiểm tra navigation methods
        if (typeof navigation.canGoBack !== 'function' || typeof navigation.dispatch !== 'function') {
          console.warn("Navigation methods not available");
          return;
        }
        
        // Sử dụng CommonActions để navigate an toàn hơn
        if (navigation.canGoBack()) {
          navigation.dispatch(CommonActions.goBack());
        } else {
          // Nếu không thể go back, navigate về Quiz page
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Quiz',
            })
          );
        }
      } catch (err) {
        console.error("Navigation error:", err);
        // Fallback: thử navigate trực tiếp nếu dispatch fail
        try {
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Quiz');
          }
        } catch (fallbackErr) {
          console.error("Fallback navigation also failed:", fallbackErr);
        }
      }
    });
  }, [isFocused, navigation]);

  useEffect(() => {
    if (!isFocused) return;

    const init = async () => {
      if (!quizId) {
        console.error("❌ Quiz ID không tồn tại");
        setLoading(false);
        Alert.alert("Error", "Quiz ID not found", [
          { 
            text: "OK", 
            onPress: () => {
              // Delay để Alert đóng hoàn toàn trước khi navigate
              setTimeout(() => {
                safeGoBack();
              }, 100);
            }
          }
        ]);
        return;
      }

      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        const result = await getQuizById(quizId);
        
        if (result.success && result.data) {
          // result.data là quiz object trực tiếp
          const quizData = result.data;
          
          if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
            const initialTimeLimit = quizData.timeLimit || 30;
            setQuiz(quizData);
            setAnswers(Array(quizData.questions.length).fill(null));
            setTimeLeft(initialTimeLimit);
            // Reset các state về ban đầu
            setCurrentQuestionIndex(0);
            setScore(0);
            setIsFinished(false);
            setAnswered(false);
            // Đảm bảo loading được set về false sau khi tất cả state đã được set
            setLoading(false);
          } else {
            console.error("❌ Quiz không hợp lệ:", {
              hasData: !!quizData,
              hasQuestions: !!quizData?.questions,
              questionsLength: quizData?.questions?.length,
            });
            setLoading(false);
            Alert.alert("Error", "Invalid quiz or no questions available", [
              { 
                text: "OK", 
                onPress: () => {
                  setTimeout(() => {
                    safeGoBack();
                  }, 100);
                }
              }
            ]);
          }
        } else {
          console.error("❌ Fetch quiz failed:", result.message);
          setLoading(false);
          Alert.alert("Error", result.message || "Unable to load quiz", [
            { 
              text: "OK", 
              onPress: () => {
                setTimeout(() => {
                  safeGoBack();
                }, 100);
              }
            }
          ]);
        }
      } catch (error) {
        console.error("❌ Init Quiz Error:", error);
        setLoading(false);
        Alert.alert("Error", error.message || "An error occurred while loading quiz", [
          { 
            text: "OK", 
            onPress: () => {
              setTimeout(() => {
                safeGoBack();
              }, 100);
            }
          }
        ]);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, isFocused, safeGoBack]);

  // Timer countdown - chỉ chạy khi quiz đã sẵn sàng
  useEffect(() => {
    // Chỉ chạy timer khi quiz đã load xong, không đang loading, và chưa finish
    if (!loading && quiz && timeLeft > 0 && !isFinished && currentQuestionIndex < quiz.questions.length && isMountedRef.current) {
      const timer = setInterval(() => {
        if (!isMountedRef.current) {
          clearInterval(timer);
          return;
        }
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            if (isMountedRef.current) {
              setIsFinished(true);
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [loading, quiz, timeLeft, isFinished, currentQuestionIndex]);

  // Auto move to next question or finish
  useEffect(() => {
    if (answered && quiz && isMountedRef.current) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (currentQuestionIndex < quiz.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setAnswered(false);
          setTimeLeft(quiz.timeLimit || 30);
        } else {
          setIsFinished(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [answered, currentQuestionIndex, quiz]);

  // Submit score when finished
  useEffect(() => {
    if (isFinished && quiz && currentUser && !submitting && isMountedRef.current) {
      handleSubmitScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, quiz, currentUser, submitting]);

  const handleAnswerSelect = (answer) => {
    if (answered || isFinished || !quiz) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setAnswered(true);
  };

  const handleSubmitScore = useCallback(async () => {
    if (!currentUser || submitting || !quizId || !isMountedRef.current) return;

    setSubmitting(true);
    try {
      const result = await submitQuizScore({
        quizId: quizId,
        score: score,
      });

      if (!result.success) {
        console.error("❌ Lưu điểm thất bại:", result.message);
      }
    } catch (error) {
      console.error("❌ Submit score error:", error);
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [currentUser, submitting, quizId, score]);

  const handlePlayAgain = () => {
    setIsFinished(false);
    setCurrentQuestionIndex(0);
    setAnswers(Array(quiz.questions.length).fill(null));
    setScore(0);
    setTimeLeft(quiz.timeLimit || 30);
    setAnswered(false);
  };


  if (loading || !quiz) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <SpinnerLoading />
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (isFinished) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full max-w-md rounded-3xl p-8 shadow-2xl items-center" style={{ backgroundColor: colors.card }}>
            {/* Trophy Icon */}
            <View className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-lg" style={{ backgroundColor: '#F59E0B' }}>
              <Ionicons name="trophy" size={48} color="white" />
            </View>

            {/* Title */}
            <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
              🎉 Completed!
            </Text>

            {/* Score */}
            <View className="my-6">
              <Text className="text-5xl font-extrabold mb-2" style={{ color: colors.primary }}>
                {score}/{quiz.questions.length}
              </Text>
              <Text className="text-lg text-center" style={{ color: colors.textSecondary }}>
                {percentage}% correct
              </Text>
            </View>

            {/* Message */}
            <Text className="text-base text-center mb-6" style={{ color: colors.textSecondary }}>
              {percentage >= 80
                ? "Excellent! You did great! 🌟"
                : percentage >= 60
                ? "Good job! Keep it up! 💪"
                : "Try again next time! You can do better! 🎯"}
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                className="flex-1 rounded-xl py-4 items-center shadow-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handlePlayAgain}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">
                  🔄 Play Again
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl py-4 items-center"
                style={{ backgroundColor: colors.surface }}
                onPress={() => {
                  InteractionManager.runAfterInteractions(() => {
                    try {
                      if (!isFocused || !isMountedRef.current) return;
                      if (!navigation || typeof navigation.dispatch !== 'function') {
                        console.warn("Navigation context not available");
                        return;
                      }
                      if (navigation.canGoBack && navigation.canGoBack()) {
                        navigation.dispatch(CommonActions.goBack());
                      } else if (typeof navigation.dispatch === 'function') {
                        navigation.dispatch(
                          CommonActions.navigate({
                            name: 'Quiz',
                          })
                        );
                      }
                    } catch (err) {
                      console.error("Navigation error:", err);
                      // Fallback
                      try {
                        if (navigation && typeof navigation.navigate === 'function') {
                          navigation.navigate('Quiz');
                        }
                      } catch (fallbackErr) {
                        console.error("Fallback navigation failed:", fallbackErr);
                      }
                    }
                  });
                }}
                activeOpacity={0.8}
              >
                <Text className="font-semibold text-base" style={{ color: colors.text }}>
                  🔙 Back
                </Text>
              </TouchableOpacity>
            </View>

            {submitting && (
              <View className="mt-4 flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Saving score...</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="px-4 py-4 shadow-sm" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity onPress={() => {
            InteractionManager.runAfterInteractions(() => {
              try {
                if (!isFocused || !isMountedRef.current) return;
                if (!navigation || typeof navigation.dispatch !== 'function') {
                  console.warn("Navigation context not available");
                  return;
                }
                if (navigation.canGoBack && navigation.canGoBack()) {
                  navigation.dispatch(CommonActions.goBack());
                } else if (typeof navigation.dispatch === 'function') {
                  navigation.dispatch(
                    CommonActions.navigate({
                      name: 'Quiz',
                    })
                  );
                }
              } catch (err) {
                console.error("Navigation error:", err);
                // Fallback
                try {
                  if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate('Quiz');
                  }
                } catch (fallbackErr) {
                  console.error("Fallback navigation failed:", fallbackErr);
                }
              }
            });
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: colors.error + '15' }}>
            <Ionicons name="time-outline" size={20} color={colors.error} />
            <Text className="text-lg font-bold" style={{ color: colors.error }}>{timeLeft}s</Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.text }}>
          {quiz.title}
        </Text>
        {/* Progress Bar */}
        <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: colors.surface }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: '#6366F1' }}
          />
        </View>
        <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
          Question {currentQuestionIndex + 1}/{quiz.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View className="flex-1 px-4 py-6" style={{ backgroundColor: colors.background }}>
        <View className="rounded-3xl p-6 shadow-xl mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text className="text-xl font-bold mb-6 text-center" style={{ color: colors.text }}>
            {currentQuestion.question}
          </Text>

          <View className="gap-3">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = answers[currentQuestionIndex] === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = answered;

              let bgColor = colors.surface;
              let borderColor = colors.border;
              let textColor = colors.text;
              let circleBg = colors.textTertiary;

              if (showResult) {
                if (isCorrect) {
                  bgColor = colors.success + '20';
                  borderColor = colors.success;
                  textColor = colors.success;
                  circleBg = colors.success;
                } else if (isSelected && !isCorrect) {
                  bgColor = colors.error + '20';
                  borderColor = colors.error;
                  textColor = colors.error;
                  circleBg = colors.error;
                }
              } else if (isSelected) {
                bgColor = colors.primary + '20';
                borderColor = colors.primary;
                textColor = colors.primary;
                circleBg = colors.primary;
              }

              return (
                <TouchableOpacity
                  key={index}
                  className="rounded-2xl p-4 border-2"
                  style={{ backgroundColor: bgColor, borderColor: borderColor }}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={answered}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: circleBg }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color="white" />
                      )}
                    </View>
                    <Text className="flex-1 text-base font-medium" style={{ color: textColor }}>
                      {option}
                    </Text>
                    {showResult && isCorrect && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
