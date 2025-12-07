import api from "../api/api";

export const getNews = async () => {
  try {
    const response = await api.get("/blog/tech-news");
    // Backend trả về { success: true, data: { articles: [...] } }
    // Frontend lấy từ response.data.articles
    const newsData = response.data?.data || response.data || {};
    const articles = newsData.articles || newsData.content || newsData || [];
    
    return {
      success: true,
      data: Array.isArray(articles) ? articles : [],
    };
  } catch (error) {
    console.error("GetNews Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải tin tức",
      data: [],
    };
  }
};

