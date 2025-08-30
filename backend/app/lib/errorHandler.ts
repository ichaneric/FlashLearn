// File: errorHandler.ts
// Description: Secure error handling utility to prevent information disclosure

import { NextRequest, NextResponse } from 'next/server';
import { isProduction } from './envConfig';

/**
 * Error types for better error handling
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  INTERNAL = 'INTERNAL',
}

/**
 * Secure error response interface
 */
interface SecureErrorResponse {
  error: string;
  type?: ErrorType;
  requestId?: string;
  details?: string; // Only in development
}

/**
 * Creates a secure error response
 * @param {ErrorType} type - The type of error
 * @param {string} message - The error message
 * @param {number} statusCode - The HTTP status code
 * @param {string} requestId - The request ID for tracking
 * @param {Error} originalError - The original error (for logging)
 * @returns {NextResponse} The secure error response
 */
export const createSecureErrorResponse = (
  type: ErrorType,
  message: string,
  statusCode: number = 500,
  requestId?: string,
  originalError?: Error
): NextResponse => {
  // Log the error for debugging (but don't expose it to the client)
  if (originalError) {
    console.error(`[ERROR ${type}] ${message}:`, {
      requestId,
      error: originalError instanceof Error ? originalError.message : 'Unknown error',
      stack: originalError instanceof Error ? originalError.stack : 'No stack trace',
      timestamp: new Date().toISOString(),
    });
  }

  const response: SecureErrorResponse = {
    error: message,
    type,
    requestId,
  };

  // Only include details in development
  if (!isProduction() && originalError) {
    response.details = originalError instanceof Error ? originalError.message : 'Unknown error';
  }

  return NextResponse.json(response, { status: statusCode });
};

/**
 * Handles common error types and creates appropriate responses
 * @param {Error} error - The error to handle
 * @param {string} requestId - The request ID
 * @param {NextRequest} request - The original request
 * @returns {NextResponse} The error response
 */
export const handleError = (
  error: Error,
  requestId: string,
  request: NextRequest
): NextResponse => {
  // Log the error with context
  console.error(`[ERROR HANDLER] ${error.message}:`, {
    requestId,
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString(),
    stack: error.stack || 'No stack trace',
  });

  // Handle specific error types
  if (error.message.includes('JWT_SECRET')) {
    return createSecureErrorResponse(
      ErrorType.INTERNAL,
      'Server configuration error',
      500,
      requestId,
      error
    );
  }

  if (error.message.includes('validation') || error.message.includes('Validation')) {
    return createSecureErrorResponse(
      ErrorType.VALIDATION,
      'Invalid input data',
      400,
      requestId,
      error
    );
  }

  if (error.message.includes('authentication') || error.message.includes('token')) {
    return createSecureErrorResponse(
      ErrorType.AUTHENTICATION,
      'Authentication failed',
      401,
      requestId,
      error
    );
  }

  if (error.message.includes('authorization') || error.message.includes('permission')) {
    return createSecureErrorResponse(
      ErrorType.AUTHORIZATION,
      'Access denied',
      403,
      requestId,
      error
    );
  }

  if (error.message.includes('not found') || error.message.includes('NotFound')) {
    return createSecureErrorResponse(
      ErrorType.NOT_FOUND,
      'Resource not found',
      404,
      requestId,
      error
    );
  }

  if (error.message.includes('database') || error.message.includes('prisma')) {
    return createSecureErrorResponse(
      ErrorType.DATABASE,
      'Database operation failed',
      500,
      requestId,
      error
    );
  }

  if (error.message.includes('api') || error.message.includes('external')) {
    return createSecureErrorResponse(
      ErrorType.EXTERNAL_API,
      'External service unavailable',
      503,
      requestId,
      error
    );
  }

  // Default internal error
  return createSecureErrorResponse(
    ErrorType.INTERNAL,
    'Internal server error',
    500,
    requestId,
    error
  );
};

/**
 * Wraps an async function with error handling
 * @param {Function} fn - The async function to wrap
 * @param {string} requestId - The request ID
 * @param {NextRequest} request - The original request
 * @returns {Promise<NextResponse>} The function result or error response
 */
export const withErrorHandling = async (
  fn: () => Promise<NextResponse>,
  requestId: string,
  request: NextRequest
): Promise<NextResponse> => {
  try {
    return await fn();
  } catch (error) {
    return handleError(error instanceof Error ? error : new Error(String(error)), requestId, request);
  }
};
