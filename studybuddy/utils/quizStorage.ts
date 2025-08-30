// File: quizStorage.ts
// Description: Utility functions for user-scoped quiz storage operations

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gets the user-scoped storage key for quiz records
 * @returns {Promise<string | null>} The storage key or null if user data not found
 */
export const getQuizStorageKey = async (): Promise<string | null> => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    if (!userData) {
      console.log('[getQuizStorageKey] No user data found');
      return null;
    }

    const parsed = JSON.parse(userData);
    // Check for both 'id' and 'user_id' for compatibility
    const userId = parsed.id || parsed.user_id;
    if (!userId) {
      console.warn('[getQuizStorageKey] No user ID found in userData:', parsed);
      return null;
    }

    return `quizRecords_${userId}`;
  } catch (error) {
    console.error('[getQuizStorageKey] Error:', error);
    return null;
  }
};

/**
 * Loads quiz records with backward compatibility for old global storage
 * @returns {Promise<any[]>} Array of quiz records
 */
export const loadQuizRecords = async (): Promise<any[]> => {
  try {
    const storageKey = await getQuizStorageKey();
    if (!storageKey) {
      return [];
    }

    const records = await AsyncStorage.getItem(storageKey);
    if (records) {
      return JSON.parse(records);
    }

    // Check for backward compatibility - old global quizRecords
    const oldRecords = await AsyncStorage.getItem('quizRecords');
    if (oldRecords) {
      console.log('[loadQuizRecords] Found old global quizRecords, migrating to user-scoped storage');
      
      // Migrate old data to user-scoped storage
      await AsyncStorage.setItem(storageKey, oldRecords);
      
      // Delete old global key
      await AsyncStorage.removeItem('quizRecords');
      
      return JSON.parse(oldRecords);
    }

    return [];
  } catch (error) {
    console.error('[loadQuizRecords] Error:', error);
    return [];
  }
};

/**
 * Saves quiz records to user-scoped storage
 * @param {any[]} records - Array of quiz records to save
 * @returns {Promise<boolean>} Success status
 */
export const saveQuizRecords = async (records: any[]): Promise<boolean> => {
  try {
    const storageKey = await getQuizStorageKey();
    if (!storageKey) {
      console.error('[saveQuizRecords] No storage key available');
      return false;
    }

    await AsyncStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('[saveQuizRecords] Error:', error);
    return false;
  }
};

/**
 * Adds a new quiz record to user-scoped storage
 * @param {any} record - The quiz record to add
 * @returns {Promise<boolean>} Success status
 */
export const addQuizRecord = async (record: any): Promise<boolean> => {
  try {
    const storageKey = await getQuizStorageKey();
    if (!storageKey) {
      console.error('[addQuizRecord] No storage key available');
      return false;
    }

    const existingRecords = await AsyncStorage.getItem(storageKey);
    const records = existingRecords ? JSON.parse(existingRecords) : [];
    records.push(record);
    
    // Keep only the last 50 records to prevent storage overflow
    if (records.length > 50) {
      records.splice(0, records.length - 50);
    }
    
    await AsyncStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('[addQuizRecord] Error:', error);
    return false;
  }
};

/**
 * Clears all quiz records for the current user
 * @returns {Promise<boolean>} Success status
 */
export const clearQuizRecords = async (): Promise<boolean> => {
  try {
    const storageKey = await getQuizStorageKey();
    if (!storageKey) {
      console.error('[clearQuizRecords] No storage key available');
      return false;
    }

    await AsyncStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('[clearQuizRecords] Error:', error);
    return false;
  }
};
