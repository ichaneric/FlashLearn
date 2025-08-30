// File: validationUtils.ts
// Description: Comprehensive input validation utilities to prevent injection attacks and data corruption

/**
 * Input validation configuration
 */
const VALIDATION_CONFIG = {
  MAX_STRING_LENGTH: 500,
  MAX_EMAIL_LENGTH: 254,
  MAX_USERNAME_LENGTH: 50,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_SET_NAME_LENGTH: 100,
  MAX_SET_DESCRIPTION_LENGTH: 500,
  MAX_CARD_QUESTION_LENGTH: 200,
  MAX_CARD_ANSWER_LENGTH: 200,
};

/**
 * Validates and sanitizes email addresses
 * @param {string} email - The email to validate
 * @returns {object} Validation result
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  const sanitized = email.trim().toLowerCase();
  
  if (sanitized.length > VALIDATION_CONFIG.MAX_EMAIL_LENGTH) {
    return { isValid: false, error: `Email must be less than ${VALIDATION_CONFIG.MAX_EMAIL_LENGTH} characters` };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validates and sanitizes usernames
 * @param {string} username - The username to validate
 * @returns {object} Validation result
 */
export const validateUsername = (username: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required' };
  }

  const sanitized = username.trim();
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (sanitized.length > VALIDATION_CONFIG.MAX_USERNAME_LENGTH) {
    return { isValid: false, error: `Username must be less than ${VALIDATION_CONFIG.MAX_USERNAME_LENGTH} characters` };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(sanitized)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { isValid: true, sanitized };
};

/**
 * Validates and sanitizes passwords
 * @param {string} password - The password to validate
 * @returns {object} Validation result
 */
export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > VALIDATION_CONFIG.MAX_PASSWORD_LENGTH) {
    return { isValid: false, error: `Password must be less than ${VALIDATION_CONFIG.MAX_PASSWORD_LENGTH} characters` };
  }

  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'user'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { isValid: false, error: 'Password is too common, please choose a stronger password' };
  }
  
  // Allow common test passwords for development
  if (process.env.NODE_ENV === 'development' && (password === '123123123' || password === 'password123')) {
    return { isValid: true };
  }

  return { isValid: true };
};

/**
 * Validates and sanitizes general text input
 * @param {string} text - The text to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {number} maxLength - Maximum allowed length
 * @returns {object} Validation result
 */
export const validateText = (
  text: string, 
  fieldName: string, 
  maxLength: number = VALIDATION_CONFIG.MAX_STRING_LENGTH
): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const sanitized = text.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be less than ${maxLength} characters` };
  }

  // Remove potentially dangerous characters
  const cleaned = sanitized.replace(/[<>]/g, '');
  
  return { isValid: true, sanitized: cleaned };
};

/**
 * Validates and sanitizes set names
 * @param {string} setName - The set name to validate
 * @returns {object} Validation result
 */
export const validateSetName = (setName: string): { isValid: boolean; error?: string; sanitized?: string } => {
  return validateText(setName, 'Set name', VALIDATION_CONFIG.MAX_SET_NAME_LENGTH);
};

/**
 * Validates and sanitizes set descriptions
 * @param {string} description - The description to validate
 * @returns {object} Validation result
 */
export const validateSetDescription = (description: string): { isValid: boolean; error?: string; sanitized?: string } => {
  if (!description) {
    return { isValid: true, sanitized: '' }; // Description is optional
  }
  return validateText(description, 'Description', VALIDATION_CONFIG.MAX_SET_DESCRIPTION_LENGTH);
};

/**
 * Validates and sanitizes card questions
 * @param {string} question - The question to validate
 * @returns {object} Validation result
 */
export const validateCardQuestion = (question: string): { isValid: boolean; error?: string; sanitized?: string } => {
  return validateText(question, 'Question', VALIDATION_CONFIG.MAX_CARD_QUESTION_LENGTH);
};

/**
 * Validates and sanitizes card answers
 * @param {string} answer - The answer to validate
 * @returns {object} Validation result
 */
export const validateCardAnswer = (answer: string): { isValid: boolean; error?: string; sanitized?: string } => {
  return validateText(answer, 'Answer', VALIDATION_CONFIG.MAX_CARD_ANSWER_LENGTH);
};

/**
 * Validates educational level
 * @param {string} level - The educational level to validate
 * @returns {object} Validation result
 */
export const validateEducationalLevel = (level: string): { isValid: boolean; error?: string; sanitized?: string } => {
  const allowedLevels = ['elementary', 'junior_highschool', 'senior_highschool', 'college'];
  const sanitized = level.trim().toLowerCase();
  
  if (!allowedLevels.includes(sanitized)) {
    return { isValid: false, error: 'Invalid educational level' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validates card count for AI generation
 * @param {number} count - The card count to validate
 * @returns {object} Validation result
 */
export const validateCardCount = (count: number): { isValid: boolean; error?: string; sanitized?: number } => {
  if (typeof count !== 'number' || isNaN(count)) {
    return { isValid: false, error: 'Card count must be a valid number' };
  }
  
  if (count < 1) {
    return { isValid: false, error: 'Card count must be at least 1' };
  }
  
  if (count > 15) {
    return { isValid: false, error: 'Card count cannot exceed 15' };
  }
  
  return { isValid: true, sanitized: Math.floor(count) };
};

/**
 * Sanitizes any string input to prevent XSS
 * @param {string} input - The input to sanitize
 * @returns {string} The sanitized input
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, VALIDATION_CONFIG.MAX_STRING_LENGTH); // Limit length
};
