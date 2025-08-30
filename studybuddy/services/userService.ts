// File: userService.ts
// Description: Service for user-related API calls

import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../config/api';

export interface UserStats {
  quizzesTakenToday: number;
  setsCreatedToday: number;
}

/**
 * Fetches user statistics for today's activity
 * @param userId - The user ID
 * @param token - Authentication token
 * @returns Promise<UserStats> - Today's quiz and set statistics
 */
export async function getUserStats(userId: string, token: string): Promise<UserStats> {
  try {
    // Validate inputs
    if (!userId || !token) {
      console.warn('[getUserStats] Missing userId or token');
      return {
        quizzesTakenToday: 0,
        setsCreatedToday: 0
      };
    }

    const response = await fetch(
      createApiUrl(`${API_ENDPOINTS.USER_STATS}/${userId}/stats`),
      getApiConfig(token)
    );

    if (!response.ok) {
      console.error(`[getUserStats] API Error: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch user stats: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      console.warn('[getUserStats] Invalid response data format');
      return {
        quizzesTakenToday: 0,
        setsCreatedToday: 0
      };
    }

    return {
      quizzesTakenToday: parseInt(data.quizzesTakenToday) || 0,
      setsCreatedToday: parseInt(data.setsCreatedToday) || 0
    };
  } catch (error) {
    console.error('[getUserStats] Error:', error);
    
    // Return default values on error to prevent app crashes
    return {
      quizzesTakenToday: 0,
      setsCreatedToday: 0
    };
  }
}
