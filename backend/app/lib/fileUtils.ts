// File: fileUtils.ts
// Description: Secure file upload utilities with proper validation and sanitization

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * File upload configuration
 */
const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  UPLOAD_DIR: 'public/uploads',
};

/**
 * Validates a file upload
 * @param {File} file - The file to validate
 * @returns {object} Validation result with success status and error message
 */
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${FILE_CONFIG.MAX_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${FILE_CONFIG.ALLOWED_TYPES.join(', ')}`
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!FILE_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File extension not allowed. Allowed extensions: ${FILE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Validate filename (prevent path traversal)
  const filename = file.name.toLowerCase();
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid filename detected'
    };
  }

  return { isValid: true };
};

/**
 * Generates a secure filename
 * @param {string} originalName - The original filename
 * @param {string} userId - The user ID
 * @returns {string} A secure filename
 */
export const generateSecureFilename = (originalName: string, userId: string): string => {
  const extension = originalName.toLowerCase().substring(originalName.lastIndexOf('.'));
  const timestamp = Date.now();
  const randomId = uuidv4().substring(0, 8);
  
  return `${userId}_${timestamp}_${randomId}${extension}`;
};

/**
 * Saves an uploaded file securely
 * @param {File} file - The file to save
 * @param {string} userId - The user ID
 * @returns {Promise<string>} The filename of the saved file
 */
export const saveUploadedFile = async (file: File, userId: string): Promise<string> => {
  try {
    // Validate the file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), FILE_CONFIG.UPLOAD_DIR);
    await mkdir(uploadsDir, { recursive: true });

    // Generate secure filename
    const filename = generateSecureFilename(file.name, userId);
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    console.log(`[File Utils] File saved successfully: ${filename}`);
    return filename;

  } catch (error) {
    console.error('[File Utils] Error saving file:', error);
    throw new Error('Failed to save uploaded file');
  }
};

/**
 * Sanitizes a filename for safe storage
 * @param {string} filename - The filename to sanitize
 * @returns {string} The sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
};
