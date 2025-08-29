import { getApiBaseUrl } from '../services/api';

/**
 * Get the full URL for an image, handling both relative and absolute URLs
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // For static files, don't prepend the API base URL since they should be served directly
  if (imageUrl.startsWith('/static/')) {
    const baseUrl = getApiBaseUrl();
    // If we're using relative API paths (/api), construct the domain URL
    if (baseUrl.startsWith('/api')) {
      return imageUrl; // Return static path as-is for NGINX to handle
    }
    // For absolute API URLs, use the same domain
    return `${baseUrl.replace('/api', '')}${imageUrl}`;
  }
  
  return `${getApiBaseUrl()}${imageUrl}`;
};

export default getImageUrl;