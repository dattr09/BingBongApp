let CLOUDINARY_CLOUD_NAME = "nguyentu11";
try {
  const env = require("@env");
  if (env.CLOUDINARY_CLOUD_NAME) {
    CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
  }
} catch (e) {}

export const getCloudinaryUrl = (publicId) => {
  if (!publicId) return null;
  
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }
  
  const cleanPublicId = publicId.startsWith("/") ? publicId.slice(1) : publicId;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cleanPublicId}`;
};

export const getCloudinaryVideoUrl = (publicId) => {
  if (!publicId) return null;
  
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }
  
  const cleanPublicId = publicId.startsWith("/") ? publicId.slice(1) : publicId;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${cleanPublicId}`;
};

