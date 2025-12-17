import api from "../api/api";

export const getTrendingMovies = async () => {
  try {
    const response = await api.get("/tmdb/movie/trending");
    return {
      success: true,
      data: response.data?.content || response.data?.data || [],
    };
  } catch (error) {
    console.error("GetTrendingMovies Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải phim",
      data: [],
    };
  }
};

// Thêm các hàm mới
export const getMoviesByCategory = async (category) => {
  try {
    const response = await api.get(`/tmdb/movie/${category}`);
    return {
      success: true,
      data: response.data?.content || response.data?.data || [],
    };
  } catch (error) {
    console.error("GetMoviesByCategory Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải phim",
      data: [],
    };
  }
};

export const getMovieCredit = async (movieId) => {
  try {
    const response = await api.get(`/tmdb/movie/credit/${movieId}`);
    return {
      success: true,
      data: response.data?.content || response.data?.data || {},
    };
  } catch (error) {
    console.error("GetMovieCredit Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải thông tin diễn viên",
      data: null,
    };
  }
};

export const getMovieDetail = async (movieId) => {
  try {
    const response = await api.get(`/tmdb/movie/detail/${movieId}`);
    return {
      success: true,
      data: response.data?.content || response.data?.data || response.data || {},
    };
  } catch (error) {
    console.error("GetMovieDetail Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải thông tin phim",
      data: null,
    };
  }
};

export const getMovieTrailer = async (movieId) => {
  try {
    const response = await api.get(`/tmdb/movie/trailer/${movieId}`);
    return {
      success: true,
      data: response.data?.content || response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("GetMovieTrailer Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải trailer",
      data: [],
    };
  }
};

export const getSimilarMovies = async (movieId) => {
  try {
    const response = await api.get(`/tmdb/movie/similar/${movieId}`);
    return {
      success: true,
      data: response.data?.content || response.data?.data || [],
    };
  } catch (error) {
    console.error("GetSimilarMovies Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải phim tương tự",
      data: [],
    };
  }
};

export const searchMovies = async (query) => {
  try {
    const response = await api.get(`/tmdb/search`, { params: { query } });
    return {
      success: true,
      data: response.data?.data || response.data?.content || [],
    };
  } catch (error) {
    console.error("SearchMovies Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tìm kiếm phim",
      data: [],
    };
  }
};

