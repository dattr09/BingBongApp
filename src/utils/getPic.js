import { API_URL } from "@env";
import { getCloudinaryUrl } from "./cloudinaryHelper";

export const getFullUrl = (path) => {
  if (!path) return null;
  
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  const pathWithoutSlash = path.startsWith("/") ? path.slice(1) : path;
  
  const defaultImages = ["default-avatar", "background-gray-default"];
  if (defaultImages.includes(pathWithoutSlash)) {
    return pathWithoutSlash === "default-avatar" 
      ? "https://i.pravatar.cc/300?img=1"
      : "https://via.placeholder.com/800x400?text=No+Cover";
  }
  
  const isBackendPath = pathWithoutSlash.toLowerCase().startsWith("api/") || 
                        pathWithoutSlash.toLowerCase().startsWith("api/v1/");
  
  if (isBackendPath) {
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  
  return getCloudinaryUrl(pathWithoutSlash);
};
