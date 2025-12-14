export const formatDateTime = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

