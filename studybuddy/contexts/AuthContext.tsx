// File: AuthContext.tsx
// Description: Authentication context for managing user login state and persistent sessions

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearBackpackStorage } from '../services/setSaveService';
import { createApiUrl, API_ENDPOINTS, getApiConfig } from '../config/api';
import axios from 'axios';

// Authentication Context Interface
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (token: string, username: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Checks if user is already authenticated by verifying stored token
   * Also verifies admin status from server
   */
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      console.log('[AuthProvider] Checking auth status, token:', token ? 'PRESENT' : 'MISSING');
      
      if (token) {
        // Token exists, verify with server and check admin status
        try {
          const response = await axios.get(createApiUrl(API_ENDPOINTS.USER_DATA), getApiConfig(token));
          const userData = response.data;
          
          setIsAuthenticated(true);
          setIsAdmin(userData.isAdmin || false);
          
          // Update stored user data
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          
          console.log('[AuthProvider] User is authenticated, admin status:', userData.isAdmin);
        } catch (error) {
          console.error('[AuthProvider] Error verifying token with server:', error);
          // Token might be invalid, clear it
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userData');
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } else {
        // No token, user needs to login
        setIsAuthenticated(false);
        setIsAdmin(false);
        console.log('[AuthProvider] User is not authenticated');
      }
    } catch (error) {
      console.error('[AuthProvider] Error checking auth status:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user login and stores authentication data
   */
  const login = async (token: string, username: string, userData: any) => {
    try {
      console.log('[AuthProvider] Login called with token:', token ? 'PRESENT' : 'MISSING');
      console.log('[AuthProvider] User data received:', {
        username,
        isAdmin: userData.isAdmin,
        userId: userData.id,
        email: userData.email
      });
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      const adminStatus = userData.isAdmin || false;
      setIsAdmin(adminStatus);
      
      console.log('[AuthProvider] Login successful, isAuthenticated set to true, admin status:', adminStatus);
      console.log('[AuthProvider] State after login - isAuthenticated:', true, 'isAdmin:', adminStatus);
    } catch (error) {
      console.error('[AuthProvider] Error during login:', error);
      throw error;
    }
  };

  /**
   * Handles user logout and clears stored data including user-scoped backpack
   */
  const logout = async () => {
    try {
      // Clear user-scoped backpack storage
      await clearBackpackStorage();
      
      // Clear authentication data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('userData');
      setIsAuthenticated(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('[AuthProvider] Error during logout:', error);
      throw error;
    }
  };

  // Check authentication status on app startup
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
