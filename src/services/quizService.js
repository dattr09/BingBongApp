import api from "../api/api";

export const getAllQuizzes = async () => {
  try {
    const response = await api.get("/quiz");
    // Backend trả về { success: true, quizzes: [...] }
    const quizzes = response.data?.quizzes || response.data?.data || response.data || [];
    return {
      success: true,
      data: Array.isArray(quizzes) ? quizzes : [],
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
    if (!quizId) {
      return {
        success: false,
        message: "Quiz ID không hợp lệ",
        data: null,
      };
    }

    const response = await api.get(`/quiz/${quizId}`);
    
    // Backend trả về { success: true, quiz: {...} } hoặc { success: false, message: "..." }
    if (response.data?.success === false) {
      return {
        success: false,
        message: response.data?.message || "Không thể tải quiz",
        data: null,
      };
    }

    // Backend trả về { success: true, quiz: {...} }
    const quiz = response.data?.quiz || response.data?.data || response.data || null;
    return {
      success: true,
      data: quiz, // Trả về quiz object trực tiếp
    };
  } catch (error) {
    console.error("GetQuizById Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Không thể tải quiz",
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

// Submit quiz score
export const submitQuizScore = async (scoreData) => {
  try {
    const response = await api.post("/quizScore/submit", scoreData);
    return {
      success: true,
      message: response.data?.message || "Nộp điểm thành công",
      data: response.data?.quizScore || response.data?.data || response.data,
    };
  } catch (error) {
    console.error("SubmitQuizScore Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể nộp điểm",
    };
  }
};

// Get leaderboard tổng (tất cả quiz)
export const getLeaderboard = async () => {
  try {
    const response = await api.get("/quizScore/leaderboard");
    // Backend trả về { success: true, leaderboard: [...] }
    const leaderboard = response.data?.leaderboard || response.data?.data || response.data || [];
    return {
      success: true,
      data: Array.isArray(leaderboard) ? leaderboard : [],
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

// Get leaderboard của một quiz cụ thể
export const getQuizLeaderboard = async (quizId) => {
  try {
    const response = await api.get(`/quizScore/leaderboard/${quizId}`);
    const leaderboard = response.data?.leaderboard || response.data?.data || response.data || [];
    return {
      success: true,
      data: Array.isArray(leaderboard) ? leaderboard : [],
    };
  } catch (error) {
    console.error("GetQuizLeaderboard Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải bảng xếp hạng",
      data: [],
    };
  }
};

