// File: errorHandler.ts
// Description: Centralized error handling utility for consistent error management

import { Alert } from 'react-native';

/**
 * Error types for different categories of errors
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error information structure
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: any;
  context?: string;
}

/**
 * Determines the type of error based on the error object
 */
export const getErrorType = (error: any): ErrorType => {
  if (error?.response?.status === 401) {
    return ErrorType.AUTHENTICATION;
  }
  if (error?.response?.status === 400) {
    return ErrorType.VALIDATION;
  }
  if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
    return ErrorType.NETWORK;
  }
  if (error?.code?.startsWith('P') || error?.message?.includes('database')) {
    return ErrorType.DATABASE;
  }
  return ErrorType.UNKNOWN;
};

/**
 * Gets user-friendly error message based on error type
 */
export const getUserFriendlyMessage = (errorType: ErrorType, originalMessage?: string): string => {
  switch (errorType) {
    case ErrorType.NETWORK:
      return 'Network connection error. Please check your internet connection and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ErrorType.VALIDATION:
      return originalMessage || 'Invalid input. Please check your data and try again.';
    case ErrorType.DATABASE:
      return 'Database error. Please try again later.';
    case ErrorType.UNKNOWN:
    default:
      return originalMessage || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Handles errors with proper logging and user feedback
 */
export const handleError = (
  error: any, 
  context: string, 
  showAlert: boolean = true,
  customMessage?: string
): ErrorInfo => {
  const errorType = getErrorType(error);
  const userMessage = customMessage || getUserFriendlyMessage(errorType, error?.message);
  
  const errorInfo: ErrorInfo = {
    type: errorType,
    message: userMessage,
    originalError: error,
    context
  };

  // Log error with context
  console.error(`[${context}] Error:`, {
    type: errorType,
    message: userMessage,
    originalError: error?.message,
    stack: error?.stack,
    response: error?.response?.data,
    status: error?.response?.status
  });

  // Show user-friendly alert if requested
  if (showAlert) {
    Alert.alert('Error', userMessage);
  }

  return errorInfo;
};

/**
 * Handles API errors specifically
 */
export const handleApiError = (
  error: any, 
  context: string, 
  showAlert: boolean = true
): ErrorInfo => {
  // Extract error message from API response
  const apiMessage = error?.response?.data?.error || error?.message;
  
  return handleError(error, context, showAlert, apiMessage);
};

/**
 * Handles authentication errors
 */
export const handleAuthError = (
  error: any, 
  context: string
): ErrorInfo => {
  return handleError(error, context, true, 'Authentication failed. Please log in again.');
};

/**
 * Handles network errors
 */
export const handleNetworkError = (
  error: any, 
  context: string
): ErrorInfo => {
  return handleError(error, context, true, 'Network connection error. Please check your internet connection.');
};
