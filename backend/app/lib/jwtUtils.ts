// File: jwtUtils.ts
// Description: Secure JWT utilities with proper secret validation and error handling

import jwt from 'jsonwebtoken';

/**
 * Gets the JWT secret with proper validation
 * @returns {string} The JWT secret
 * @throws {Error} If JWT_SECRET is not properly configured
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  if (secret === 'your-secret-key' || secret.length < 32) {
    throw new Error('JWT_SECRET must be a strong secret (at least 32 characters)');
  }
  
  return secret;
};

/**
 * Verifies a JWT token with proper error handling
 * @param {string} token - The JWT token to verify
 * @returns {any} Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): any => {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('[JWT Utils] Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
};

/**
 * Signs a JWT token with proper configuration
 * @param {object} payload - The token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} The signed JWT token
 */
export const signToken = (payload: object, expiresIn: string = '30d'): string => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Extracts and verifies token from Authorization header
 * @param {string} authHeader - The Authorization header value
 * @returns {any} Decoded token payload or null if invalid
 */
export const extractAndVerifyToken = (authHeader: string | null): any => {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return verifyToken(parts[1]);
};
