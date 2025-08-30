// File: setSaveService.ts
// Description: Service to handle saving and unsaving sets, tracking learner counts with user-scoped storage

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../config/api';

/**
 * Gets the user-scoped storage key for backpack sets
 * @param {string} userId - The user ID to scope the storage
 * @returns {string} - The storage key for this user's backpack
 */
const getBackpackStorageKey = (userId: string): string => {
  return `backpackSets_${userId}`;
};

/**
 * Gets the current user ID from AsyncStorage
 * @returns {Promise<string|null>} - The current user ID or null if not found
 */
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      // Check for both 'id' and 'user_id' for compatibility
      const userId = parsed.id || parsed.user_id;
      if (!userId) {
        console.warn('[getCurrentUserId] No user ID found in userData:', parsed);
        return null;
      }
      return userId;
    }
    return null;
  } catch (error) {
    console.error('[getCurrentUserId] Error:', error);
    return null;
  }
};

/**
 * Saves a set and returns the updated learner count
 * @param {string} set_id - The ID of the set to save
 * @returns {Promise<{success: boolean, learnerCount: number}>} - Success status and updated learner count
 */
export const saveSet = async (set_id: string): Promise<{success: boolean, learnerCount: number}> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(createApiUrl('/api/set/save'), {
      set_id,
      action: 'save'
    }, getApiConfig(token));

    return {
      success: response.data.success,
      learnerCount: response.data.learnerCount
    };
  } catch (error) {
    console.error('[saveSet] Error:', error);
    throw error;
  }
};

/**
 * Unsaves a set and returns the updated learner count
 * @param {string} set_id - The ID of the set to unsave
 * @returns {Promise<{success: boolean, learnerCount: number}>} - Success status and updated learner count
 */
export const unsaveSet = async (set_id: string): Promise<{success: boolean, learnerCount: number}> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(createApiUrl('/api/set/save'), {
      set_id,
      action: 'unsave'
    }, getApiConfig(token));

    return {
      success: response.data.success,
      learnerCount: response.data.learnerCount
    };
  } catch (error) {
    console.error('[unsaveSet] Error:', error);
    throw error;
  }
};

/**
 * Gets the save status and learner count for a set
 * @param {string} set_id - The ID of the set to check
 * @returns {Promise<{learnerCount: number, isSaved: boolean}>} - Learner count and save status
 */
export const getSetSaveStatus = async (set_id: string): Promise<{learnerCount: number, isSaved: boolean}> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${createApiUrl(API_ENDPOINTS.SET_SAVE)}?set_id=${set_id}`, getApiConfig(token));

    return {
      learnerCount: response.data.learnerCount,
      isSaved: response.data.isSaved
    };
  } catch (error) {
    console.error('[getSetSaveStatus] Error:', error);
    throw error;
  }
};

/**
 * Fetches the user's backpack sets from the API
 * @returns {Promise<{success: boolean, backpackSets: Array, count: number}>} - Backpack sets and count
 */
export const fetchBackpackSets = async (): Promise<{success: boolean, backpackSets: Array, count: number}> => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(createApiUrl('/api/set/backpack'), getApiConfig(token));

    return {
      success: response.data.success,
      backpackSets: response.data.backpackSets || [],
      count: response.data.count || 0
    };
  } catch (error) {
    console.error('[fetchBackpackSets] Error:', error);
    throw error;
  }
};

/**
 * Saves backpack sets to user-scoped AsyncStorage
 * @param {Array} backpackSets - The backpack sets to save
 * @returns {Promise<void>} - Promise that resolves when saved
 */
export const saveBackpackToStorage = async (backpackSets: Array): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('[saveBackpackToStorage] No user ID found, using fallback key');
      await AsyncStorage.setItem('backpackSets', JSON.stringify(backpackSets));
      return;
    }

    const key = getBackpackStorageKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(backpackSets));
  } catch (error) {
    console.error('[saveBackpackToStorage] Error:', error);
    throw error;
  }
};

/**
 * Loads backpack sets from user-scoped AsyncStorage
 * @returns {Promise<Array>} - The user's backpack sets
 */
export const loadBackpackFromStorage = async (): Promise<Array> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('[loadBackpackFromStorage] No user ID found, using fallback key');
      const fallback = await AsyncStorage.getItem('backpackSets');
      return fallback ? JSON.parse(fallback) : [];
    }

    const key = getBackpackStorageKey(userId);
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[loadBackpackFromStorage] Error:', error);
    return [];
  }
};

/**
 * Clears backpack sets from user-scoped AsyncStorage
 * @returns {Promise<void>} - Promise that resolves when cleared
 */
export const clearBackpackStorage = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('[clearBackpackStorage] No user ID found, clearing fallback key');
      await AsyncStorage.removeItem('backpackSets');
      return;
    }

    const key = getBackpackStorageKey(userId);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('[clearBackpackStorage] Error:', error);
    throw error;
  }
};
