// Helper function để chuyển tier thành màu
export const badgeTierToColor = (tier) => {
  switch (tier) {
    case "Bronze":
      return "#B87333";
    case "Silver":
      return "#C0C0C0";
    case "Gold":
      return "#FFD700";
    case "Platinum":
      return "#0fbf9c";
    case "Diamond":
      return "#1464F4";
    case "Master":
      return "#7B1FA2";
    case "Grandmaster":
      return "#D32F2F";
    case "Challenger":
      return "#FF8C00";
    default:
      return "#3B82F6"; // default accent color
  }
};

// Helper function để tính progress của badge
export const computeBadgeProgress = (badge, stats) => {
  if (!badge?.condition || !stats) {
    return { current: 0, target: 1 };
  }

  const cond = badge.condition;
  const statKey =
    cond.type === "posts_count"
      ? stats.posts_count || 0
      : cond.type === "comments_count"
      ? stats.comments_count || 0
      : cond.type === "likes_received"
      ? stats.likes_received || 0
      : cond.type === "friends_count"
      ? stats.friends_count || 0
      : cond.type === "account_age"
      ? stats.account_age || 0
      : 0;

  return { current: statKey, target: cond.value || 1 };
};

