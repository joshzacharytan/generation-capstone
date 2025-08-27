import { getApiBaseUrl } from '../services/api';

/**
 * Get the full URL for an image, handling both relative and absolute URLs
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${getApiBaseUrl()}${imageUrl}`;
};

export default getImageUrl;