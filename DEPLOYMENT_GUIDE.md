# FlashLearn Deployment Guide

## 🚀 Backend Deployment (Vercel)

### Prerequisites
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Use Vercel Postgres, Supabase, or Railway
3. **GitHub Repository**: Push your code to GitHub

### Step 1: Deploy Backend to Vercel

1. **Connect Repository**:
   ```bash
   # In Vercel dashboard, import your GitHub repository
   # Select the 'backend' folder as the root directory
   ```

2. **Set Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_secure_jwt_secret_key
   DEEPSEEK_API_KEY=your_deepseek_api_key
   NODE_ENV=production
   ```

3. **Deploy**:
   - Vercel will automatically build and deploy
   - The build will ignore ESLint errors (configured in next.config.js)
   - Your API will be available at: `https://your-project.vercel.app`

### Step 2: Update Mobile App Configuration

1. **Update API URL** in `studybuddy/config/api.ts`:
   ```typescript
   production: 'https://your-actual-vercel-url.vercel.app'
   ```

## 📱 Mobile App Distribution (APK)

### Prerequisites
1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install with `npm install -g @expo/eas-cli`

### Step 1: Configure EAS

1. **Login to Expo**:
   ```bash
   eas login
   ```

2. **Configure Project**:
   ```bash
   cd studybuddy
   eas build:configure
   ```

3. **Update Project ID** in `app.json`:
   ```json
   "eas": {
     "projectId": "your-actual-project-id"
   }
   ```

### Step 2: Build APK

1. **Development Build** (for testing):
   ```bash
   eas build --platform android --profile development
   ```

2. **Production APK** (for distribution):
   ```bash
   eas build --platform android --profile production
   ```

3. **Download APK**:
   - Build will be available in Expo dashboard
   - Download the APK file
   - Share with users or upload to app stores

### Step 3: Distribution Options

#### Option A: Direct APK Distribution
- Share APK file directly with users
- Users enable "Install from unknown sources" on Android
- Simple but limited reach

#### Option B: Google Play Store
1. **Create Developer Account** ($25 one-time fee)
2. **Prepare Store Listing**:
   - App description
   - Screenshots
   - Privacy policy
3. **Upload APK** and submit for review
4. **Publish** when approved

#### Option C: Alternative App Stores
- **Amazon Appstore**
- **Huawei AppGallery**
- **Samsung Galaxy Store**

## 🔧 Troubleshooting

### Backend Issues
1. **Build Failures**: Check environment variables
2. **Database Connection**: Verify DATABASE_URL format
3. **CORS Errors**: Ensure CORS headers are set

### Mobile App Issues
1. **API Connection**: Verify production URL in config
2. **Build Failures**: Check EAS project configuration
3. **Permission Issues**: Verify Android permissions

## 📋 Checklist

### Backend Deployment
- [ ] Environment variables set in Vercel
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] CORS configured properly

### Mobile App Distribution
- [ ] EAS project configured
- [ ] Production API URL updated
- [ ] APK built successfully
- [ ] App tested on real devices
- [ ] Distribution method chosen

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Expo build logs
5. Ensure database is accessible

## 🔄 Updates

To update your app:
1. **Backend**: Push changes to GitHub, Vercel auto-deploys
2. **Mobile**: Update version in `app.json`, rebuild APK
3. **Database**: Run migrations if needed
