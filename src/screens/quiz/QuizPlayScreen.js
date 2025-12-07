import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getQuizById } from "../../services/quizService";

export default function QuizPlayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { quizId } = route.params || {};

  const [quiz, setQuiz] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        const result = await getQuizById(quizId);
        if (result.success) {
          const quizData = result.data;
          setQuiz(quizData);
          setAnswers(Array(quizData.questions?.length || 0).fill(null));
        } else {
          Alert.alert("Lỗi", "Không thể tải quiz");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Init Quiz Error:", error);
        Alert.alert("Lỗi", "Đã xảy ra lỗi");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      init();
    }
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && quiz) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isFinished, quiz]);

  useEffect(() => {
    if (timeLeft === 0 && quiz) {
      setIsFinished(true);
    }
  }, [timeLeft, quiz]);

  useEffect(() => {
    if (answered && quiz) {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setAnswered(false);
          setTimeLeft(30);
        } else {
          setIsFinished(true);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [answered, currentQuestionIndex, quiz]);

  const handleAnswerSelect = (answer) => {
    if (answered || isFinished) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }

    setAnswered(true);
  };

  const handlePlayAgain = () => {
    setIsFinished(false);
    setCurrentQuestionIndex(0);
    setAnswers(Array(quiz.questions.length).fill(null));
    setScore(0);
    setTimeLeft(30);
    setAnswered(false);
  };

  if (loading || !quiz) {
    return <SpinnerLoading />;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (isFinished) {
    return (
      <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white items-center justify-center px-6">
        <View className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg items-center">
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="trophy" size={48} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Hoàn thành!
          </Text>
          <Text className="text-4xl font-bold text-blue-600 mb-4">
            {score}/{quiz.questions.length}
          </Text>
          <Text className="text-sm text-gray-600 text-center mb-6">
            Bạn đã trả lời đúng {score} trên tổng số {quiz.questions.length} câu hỏi
          </Text>
          <View className="flex-row gap-4 w-full">
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              onPress={handlePlayAgain}
            >
              <Text className="text-white font-semibold">Chơi lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-gray-900 font-semibold">Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Ionicons name="time-outline" size={20} color="#EF4444" />
            <Text className="text-lg font-bold text-red-600">{timeLeft}s</Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-gray-900 mt-2 text-center">
          {quiz.title}
        </Text>
        <View className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-600"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-sm text-gray-500 text-center mt-1">
          Câu {currentQuestionIndex + 1}/{quiz.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View className="flex-1 px-6 py-8">
        <View className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </Text>

          <View className="gap-3">
            {currentQuestion.options?.map((option, index) => {
              const isSelected = answers[currentQuestionIndex] === option;
              const isCorrect = option === currentQuestion.correctAnswer;
              const showResult = answered;

              let bgColor = "bg-gray-100";
              if (showResult) {
                if (isCorrect) {
                  bgColor = "bg-green-100";
                } else if (isSelected && !isCorrect) {
                  bgColor = "bg-red-100";
                }
              } else if (isSelected) {
                bgColor = "bg-blue-100";
              }

              return (
                <TouchableOpacity
                  key={index}
                  className={`${bgColor} rounded-xl p-4 border-2 ${
                    isSelected ? "border-blue-600" : "border-transparent"
                  }`}
                  onPress={() => handleAnswerSelect(option)}
                  disabled={answered}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isSelected ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <Text className="flex-1 text-base text-gray-900">
                      {option}
                    </Text>
                    {showResult && isCorrect && (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
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

