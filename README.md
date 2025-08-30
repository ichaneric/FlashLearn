# FlashLearn App

A comprehensive study companion app with flashcard creation, quiz functionality, and admin management.

## 🏗️ Project Structure

```
FlashLearn_App/
├── backend/                 # Next.js API Backend
│   ├── app/api/            # API Routes
│   ├── prisma/             # Database Schema
│   └── package.json
├── studybuddy/             # React Native Frontend
│   ├── app/                # Expo Router Screens
│   ├── components/         # Reusable Components
│   └── package.json
└── README.md
```

## 🚀 Deployment Guide

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- EAS CLI
- Vercel Account
- GitHub Account
- PostgreSQL Database

### 1. Backend Deployment (Vercel)

#### Step 1: Prepare Database
1. Set up PostgreSQL database (Supabase, Railway, or AWS RDS)
2. Update `backend/prisma/schema.prisma` with your database URL
3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

#### Step 2: Deploy to Vercel
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy backend:
   ```bash
   cd backend
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_BASE_URL`

### 2. Frontend Deployment (Expo EAS)

#### Step 1: Configure EAS
1. Login to Expo:
   ```bash
   eas login
   ```

2. Configure project:
   ```bash
   cd studybuddy
   eas build:configure
   ```

3. Update `app.json` with your project ID

#### Step 2: Build APK
1. Build for Android:
   ```bash
   eas build --platform android --profile production
   ```

2. Download APK from Expo dashboard

### 3. GitHub Actions Setup

#### Step 1: Repository Secrets
Add these secrets to your GitHub repository:

**Backend Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Frontend Secrets:**
- `EXPO_TOKEN`

#### Step 2: Automated Deployment
- Backend auto-deploys on push to `main` branch
- APK builds on release creation
- Workflows are in `.github/workflows/`

## 📱 App Features

### User Features
- ✅ User registration and authentication
- ✅ Flashcard set creation and management
- ✅ Interactive quiz mode
- ✅ Progress tracking
- ✅ Profile management with avatar selection
- ✅ Modern UI with animations

### Admin Features
- ✅ Admin dashboard with analytics
- ✅ User management
- ✅ Set management and deletion
- ✅ Admin set viewer (no quiz mode)
- ✅ Secure admin routing

### Technical Features
- ✅ JWT authentication
- ✅ File upload support
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Offline quiz storage

## 🔧 Development Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd studybuddy
npm install
npx expo start
```

## 📊 Database Schema

- **Users**: Authentication and profile data
- **Sets**: Flashcard collections
- **Cards**: Individual flashcards
- **SetSaves**: User-set relationships
- **QuizRecords**: Quiz attempt tracking

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- File upload restrictions
- Admin role verification

## 📦 Build Commands

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd studybuddy
eas build --platform android
eas build --platform ios
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/user/data` - Get user profile
- `PUT /api/user/data` - Update user profile

### Admin
- `GET /api/admin/dashboard` - Admin statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/sets` - Set management
- `DELETE /api/admin/sets/delete` - Delete sets

### Sets & Cards
- `GET /api/set/[set_id]` - Get set details
- `POST /api/set/create` - Create new set

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For support, email support@flashlearn.com or create an issue on GitHub.
