/**
 * Format date to DD-MMM-YYYY format (e.g., 27-Feb-2026)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted date string
 */
export const formatDateDDMmmYYYY = (date) => {
  if (!date) return '–';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '–';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Truncate text with ellipsis and show full text on hover
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {object} Object with truncated text and full text for tooltip
 */
export const getTruncatedText = (text, maxLength = 30) => {
  if (!text) return { display: '–', full: '–' };
  
  const textStr = String(text);
  if (textStr.length <= maxLength) {
    return { display: textStr, full: textStr };
  }
  
  return {
    display: textStr.substring(0, maxLength) + '...',
    full: textStr
  };
};
