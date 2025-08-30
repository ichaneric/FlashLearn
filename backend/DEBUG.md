# Backend Debugging Guide

## Enhanced Error Logging

The backend now includes comprehensive error logging to help identify and fix issues quickly.

### Log Format

All logs follow this format:
```
[TAG REQUEST_ID] Message: { data }
```

Examples:
- `[SIGNUP a1b2c3d4] POST request received`
- `[LOGIN e5f6g7h8] Database connected successfully`
- `[USER_DATA i9j0k1l2] Token verified for user_id: abc123`

### Error Logging

Errors are logged with detailed information:
```
[TAG ERROR] STEP: {
  timestamp: "2024-01-01T12:00:00.000Z",
  step: "DATABASE_CONNECTION",
  error: {
    message: "Connection failed",
    code: "P1001",
    meta: { ... },
    stack: "..."
  },
  additionalData: { ... }
}
```

## Common Issues and Solutions

### 1. Database Connection Issues

**Symptoms:**
- `Database connection failed` error
- `P1001` Prisma error code

**Solutions:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Ensure PostgreSQL is running
3. Verify database credentials
4. Run `npx prisma migrate dev` to ensure schema is up to date

### 2. Authentication Issues

**Symptoms:**
- `Invalid or expired token` error
- `Authorization header missing` error

**Solutions:**
1. Check JWT_SECRET in `.env` file
2. Ensure token is being sent in Authorization header
3. Verify token format: `Bearer <token>`

### 3. Missing Required Fields

**Symptoms:**
- `Missing required fields` error
- Validation errors

**Solutions:**
1. Check request body includes all required fields
2. Verify field names match exactly (e.g., `full_name` not `fullName`)
3. Ensure no empty strings are sent

### 4. Duplicate User/Data

**Symptoms:**
- `User with this email already exists` error
- `P2002` Prisma error code

**Solutions:**
1. Use different email/username for testing
2. Check database for existing records
3. Clear test data if needed

## Testing the API

### Run the Test Script

```bash
cd backend
node test-api.js
```

This will test:
- User signup
- User login
- User data retrieval
- Set creation

### Manual Testing with curl

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "full_name": "Test User",
    "email": "test@example.com",
    "educational_level": "college",
    "password": "testpass123",
    "profile": "1.jpg"
  }'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Test user data (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/user/data \
  -H "Authorization: Bearer TOKEN"
```

## Debugging Steps

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Check Console Output
Look for:
- `[MIDDLEWARE]` logs for incoming requests
- `[SIGNUP]`, `[LOGIN]`, etc. logs for specific operations
- `[ERROR]` logs for detailed error information

### 3. Test Each Endpoint
Use the test script or manual curl commands to test each endpoint individually.

### 4. Check Database
```bash
# Connect to your database and check tables
npx prisma studio
```

### 5. Verify Environment Variables
Ensure your `.env` file contains:
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key"
```

## Request Flow Debugging

### Signup Flow
1. `[MIDDLEWARE]` - Request received
2. `[SIGNUP]` - Request processing started
3. `[SIGNUP]` - Request body parsed
4. `[SIGNUP]` - Validation checks
5. `[SIGNUP]` - Database connection test
6. `[SIGNUP]` - User creation
7. `[SIGNUP]` - Success response

### Login Flow
1. `[MIDDLEWARE]` - Request received
2. `[LOGIN]` - Request processing started
3. `[LOGIN]` - Request body parsed
4. `[LOGIN]` - Validation checks
5. `[LOGIN]` - Database connection test
6. `[LOGIN]` - User lookup
7. `[LOGIN]` - Password verification
8. `[LOGIN]` - JWT token generation
9. `[LOGIN]` - Success response

## Common Error Codes

- `P2002` - Unique constraint violation (duplicate data)
- `P2003` - Foreign key constraint violation
- `P2025` - Record not found
- `P1001` - Database connection failed
- `401` - Unauthorized (invalid/missing token)
- `400` - Bad request (validation errors)
- `409` - Conflict (duplicate data)
- `500` - Internal server error

## Getting Help

If you're still having issues:

1. **Check the logs** - Look for detailed error messages
2. **Run the test script** - See which specific operations fail
3. **Verify database** - Ensure tables exist and are properly structured
4. **Check network** - Ensure frontend can reach backend
5. **Review environment** - Verify all environment variables are set correctly

The enhanced logging will help identify exactly where the issue occurs in the request flow. 