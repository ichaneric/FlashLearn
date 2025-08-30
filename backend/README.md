# FlashLearn Backend

A Next.js backend API for the FlashLearn flashcard application.

## Features

- User authentication and authorization
- Flashcard set management
- AI-powered flashcard generation
- File upload handling
- Admin dashboard functionality

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `NEXT_PUBLIC_BASE_URL`: Base URL for the frontend application
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `MAX_FILE_SIZE`: Maximum file size for uploads (in bytes)
- `UPLOAD_DIR`: Directory for storing uploaded files

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`

3. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

This backend is deployed on Vercel with automatic deployments from the main branch.

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/user/data` - Get user data
- `PUT /api/user/data` - Update user data
- `POST /api/flashcard/generate` - Generate flashcards using AI
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/dashboard` - Get dashboard stats (admin only)

## Build Fix Applied

- Removed openai import to prevent build errors
- Service now uses fallback generation instead of API calls
