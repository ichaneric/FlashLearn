// File: adminService.ts
// Description: Admin service for fetching real data from backend endpoints

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../config/api';
import axios from 'axios';

/**
 * Fetches dashboard statistics from the backend
 * @returns {Promise<Object>} Dashboard statistics data
 */
export const fetchDashboardStats = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('[adminService] No authentication token found');
      throw new Error('Authentication required');
    }

    console.log('[adminService] Fetching dashboard stats from server...');
    console.log('[adminService] API URL:', createApiUrl(API_ENDPOINTS.ADMIN_DASHBOARD));
    
    const response = await axios.get(
      createApiUrl(API_ENDPOINTS.ADMIN_DASHBOARD),
      getApiConfig(token)
    );
    
    console.log('[adminService] Dashboard stats received:', response.data);
    console.log('[adminService] Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('[adminService] Error fetching dashboard stats:', error);
    console.error('[adminService] Error response:', error.response?.data);
    console.error('[adminService] Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Failed to load dashboard data. Please try again.');
    }
  }
};

/**
 * Fetches users data from the backend
 * @returns {Promise<Array>} Array of user data
 */
export const fetchUsers = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('[adminService] No authentication token found');
      throw new Error('Authentication required');
    }

    console.log('[adminService] Fetching users data from server...');
    console.log('[adminService] API URL:', createApiUrl(API_ENDPOINTS.ADMIN_USERS));
    
    const response = await axios.get(
      createApiUrl(API_ENDPOINTS.ADMIN_USERS),
      getApiConfig(token)
    );
    
    console.log('[adminService] Users data received:', response.data);
    console.log('[adminService] Response status:', response.status);
    return response.data;
  } catch (error) {
    console.error('[adminService] Error fetching users:', error);
    console.error('[adminService] Error response:', error.response?.data);
    console.error('[adminService] Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Failed to load users data. Please try again.');
    }
  }
};

/**
 * Fetches analytics data from the backend
 * @returns {Promise<Object>} Analytics data
 */
export const fetchAnalytics = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('[adminService] No authentication token found');
      throw new Error('Authentication required');
    }

    console.log('[adminService] Fetching analytics data from server...');
    const response = await axios.get(
      createApiUrl(API_ENDPOINTS.ADMIN_ANALYTICS),
      getApiConfig(token)
    );
    
    console.log('[adminService] Analytics data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('[adminService] Error fetching analytics:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Failed to load analytics data. Please try again.');
    }
  }
};

/**
 * Fetches admin sets data from the backend
 * @returns {Promise<Array>} Array of set data
 */
export const fetchAdminSets = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('[adminService] No authentication token found');
      throw new Error('Authentication required');
    }

    console.log('[adminService] Fetching admin sets data from server...');
    const response = await axios.get(
      createApiUrl(API_ENDPOINTS.ADMIN_SETS),
      getApiConfig(token)
    );
    
    console.log('[adminService] Admin sets data received:', response.data);
    return response.data;
  } catch (error) {
    console.error('[adminService] Error fetching admin sets:', error);
    
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('Failed to load sets data. Please try again.');
    }
  }
};
