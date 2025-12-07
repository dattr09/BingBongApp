import { API_URL } from "@env";
export const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("https")) {
    return path;
  }
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
