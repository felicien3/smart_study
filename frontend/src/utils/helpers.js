/**
 * Get the week number of the year
 * @returns {number} Week number
 */
export const getWeekNumber = (date = new Date()) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString();
};

/**
 * Get difficulty label
 * @param {number} difficulty - Difficulty level (1-5)
 * @returns {string} Difficulty label
 */
export const getDifficultyLabel = (difficulty) => {
  const labels = {
    1: "Very Easy",
    2: "Easy",
    3: "Medium",
    4: "Hard",
    5: "Very Hard",
  };
  return labels[difficulty] || "Medium";
};

/**
 * Get color based on score
 * @param {number} score - Score (0-100)
 * @returns {string} CSS color class
 */
export const getScoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};

/**
 * Get API base URL
 * @returns {string} API base URL
 */
export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:5000";
};

/**
 * Get auth token from localStorage
 * @returns {string|null} Auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem("token");
};
