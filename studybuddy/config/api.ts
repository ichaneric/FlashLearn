// File: api.ts
// Description: API configuration for backend endpoints with environment-based URL selection

/**
 * API Configuration
 * Determines the backend URL based on environment and platform
 */

// Development configurations for different environments
const API_CONFIGS = {
  // Local development (when running backend locally)
  local: 'http://127.0.0.1:3001',
  
  // Network development (when testing on physical device)
  // Your actual local network IP address
  network: 'http://192.168.254.104:3001',
  
  // Production (when deployed to Vercel)
  production: 'https://flash-learn-app.vercel.app',
};

/**
 * Gets the appropriate API base URL
 * @returns {string} The API base URL
 */
export const getApiBaseUrl = (): string => {
  // Check if we're in production environment
  if (__DEV__) {
    // Development mode - use network IP for mobile testing
    return API_CONFIGS.network;
  } else {
    // Production mode - use Vercel URL
    return API_CONFIGS.production;
  }
};

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  SIGNUP: '/api/auth/signup',
  
  // User management
  USER_DATA: '/api/user/data',
  USER_STATS: '/api/user',
  UPDATE_PROFILE: '/api/user/update-profile',
  
  // Flashcard sets
  SET_ALL: '/api/set/all',
  SET_POSTED: '/api/set/posted',
  SET_CREATE: '/api/set/create',
  SET_SAVE: '/api/set/save',
  SET: '/api/set',
  SET_DRAFTS: '/api/set/drafts',
  SET_UPDATE: '/api/sets/[id]',
  SET_ADD_FLASHCARD: '/api/sets/[id]/flashcards',
  
  // Cards
  CARD_CREATE: '/api/card/create',
  FLASHCARD_UPDATE: '/api/flashcards/[id]',
  FLASHCARD_DELETE: '/api/flashcards/[id]',
  
  // AI Features
  FLASHCARD_GENERATE: '/api/flashcard/generate',
  FLASHCARD_VALIDATE: '/api/flashcard/validate',
  
  // Uploads
  UPLOADS: '/api/uploads',
  
  // Admin endpoints
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_SETS: '/api/admin/sets',
  ADMIN_ANALYTICS: '/api/admin/analytics',
  ADMIN_DELETE_SET: '/api/admin/sets/delete',
} as const;

/**
 * Creates full API URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} Full API URL
 */
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

/**
 * Default configuration for API requests
 */
export const getApiConfig = (token?: string) => ({
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  timeout: 15000, // 15 second timeout
  withCredentials: false, // Disable credentials for CORS
});

/**
 * Configuration for FormData requests
 */
export const getFormDataConfig = (token?: string) => ({
  headers: {
    'Content-Type': 'multipart/form-data',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  timeout: 30000, // 30 second timeout for file uploads
  withCredentials: false, // Disable credentials for CORS
});
