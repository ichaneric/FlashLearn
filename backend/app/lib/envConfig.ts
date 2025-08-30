// File: envConfig.ts
// Description: Secure environment configuration utility to validate all required environment variables

/**
 * Environment configuration interface
 */
interface EnvConfig {
  NODE_ENV: string;
  JWT_SECRET: string;
  DATABASE_URL: string;
  DEEPSEEK_API_KEY?: string;
  PORT?: string;
}

/**
 * Validates and returns environment configuration
 * @returns {EnvConfig} The validated environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
export const getEnvConfig = (): EnvConfig => {
  const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || '',
    DATABASE_URL: process.env.DATABASE_URL || '',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    PORT: process.env.PORT || '3000',
  };

  // Validate JWT_SECRET
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (config.JWT_SECRET === 'your-secret-key' || config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be a strong secret (at least 32 characters)');
  }

  // Validate DATABASE_URL
  if (!config.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(config.NODE_ENV)) {
    throw new Error(`NODE_ENV must be one of: ${validEnvironments.join(', ')}`);
  }

  // Validate DEEPSEEK_API_KEY (optional but if provided, must be valid)
  if (config.DEEPSEEK_API_KEY && config.DEEPSEEK_API_KEY === 'your-deepseek-api-key-here') {
    console.warn('[Env Config] DEEPSEEK_API_KEY is set to default value, AI features will use fallback');
  }

  return config;
};

/**
 * Checks if the application is running in production
 * @returns {boolean} True if in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Checks if the application is running in development
 * @returns {boolean} True if in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Gets the current environment name
 * @returns {string} The current environment name
 */
export const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};
