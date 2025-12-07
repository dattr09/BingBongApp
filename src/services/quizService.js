import api from "../api/api";

export const getAllQuizzes = async () => {
  try {
    const response = await api.get("/quiz");
    return {
      success: true,
      data: response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("GetAllQuizzes Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải quiz",
      data: [],
    };
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}`);
    return {
      success: true,
      data: response.data?.data || response.data || null,
    };
  } catch (error) {
    console.error("GetQuizById Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải quiz",
      data: null,
    };
  }
};

export const createQuiz = async (quizData) => {
  try {
    const response = await api.post("/quiz", quizData);
    return {
      success: true,
      message: response.data?.message || "Tạo quiz thành công",
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("CreateQuiz Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tạo quiz",
    };
  }
};

export const submitQuizAnswer = async (quizId, answers) => {
  try {
    const response = await api.post(`/quiz/${quizId}/submit`, { answers });
    return {
      success: true,
      message: response.data?.message || "Nộp bài thành công",
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("SubmitQuizAnswer Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể nộp bài",
    };
  }
};

export const getLeaderboard = async (quizId) => {
  try {
    const response = await api.get(`/quiz/${quizId}/leaderboard`);
    return {
      success: true,
      data: response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("GetLeaderboard Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bảng xếp hạng",
      data: [],
    };
  }
};

