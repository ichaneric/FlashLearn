# 🔒 FlashLearn Security Documentation

This document outlines the security measures implemented in the FlashLearn application to protect against common vulnerabilities and threats.

## 🚀 Quick Start

1. **Set up secure environment:**
   ```bash
   npm run setup
   ```

2. **Run security check:**
   ```bash
   npm run security-check
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## 🛡️ Security Features Implemented

### **1. Authentication & Authorization**

- **Secure JWT Implementation**: Uses cryptographically secure JWT tokens with proper validation
- **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
- **Token Validation**: Comprehensive token verification on all protected routes
- **Admin Role Management**: Proper role-based access control for administrative functions

### **2. Input Validation & Sanitization**

- **Comprehensive Validation**: All user inputs are validated and sanitized
- **XSS Prevention**: HTML tags and dangerous characters are stripped from inputs
- **SQL Injection Prevention**: All database queries use Prisma ORM with parameterized queries
- **File Upload Security**: Secure file upload with type, size, and content validation

### **3. CORS & Security Headers**

- **Restrictive CORS**: Only allows specific origins in production
- **Security Headers**: Implements comprehensive security headers
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### **4. Error Handling**

- **Secure Error Responses**: Prevents information disclosure in production
- **Comprehensive Logging**: Detailed error logging for debugging while protecting sensitive data
- **Graceful Degradation**: Application continues to function even when external services fail

### **5. File Security**

- **Secure File Uploads**: Validates file types, sizes, and content
- **Path Traversal Prevention**: Prevents directory traversal attacks
- **Secure File Storage**: Files are stored with random, secure names

### **6. Environment Security**

- **Environment Validation**: Validates all required environment variables
- **Secure Secrets**: Generates cryptographically secure secrets
- **Configuration Management**: Centralized configuration with validation

## 🔧 Security Configuration

### **Environment Variables**

Create a `.env` file with the following variables:

```env
# Environment
NODE_ENV=development

# Security
JWT_SECRET=your-64-character-secret-key-here

# Database
DATABASE_URL="file:./prisma/dev.db"

# AI Service (Optional)
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Server
PORT=3000

# Security Headers
SECURE_HEADERS=true

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
```

### **Generate Secure JWT Secret**

```bash
# Generate a secure 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚨 Security Best Practices

### **For Developers**

1. **Never commit sensitive files:**
   - `.env` files
   - Database files (`*.db`)
   - Uploaded user files

2. **Use secure coding practices:**
   - Always validate and sanitize inputs
   - Use parameterized queries (Prisma handles this)
   - Implement proper error handling
   - Log security events

3. **Regular security updates:**
   - Keep dependencies updated
   - Run security audits: `npm audit`
   - Monitor for vulnerabilities

### **For Production Deployment**

1. **Environment Configuration:**
   - Use strong, unique JWT secrets
   - Configure proper CORS origins
   - Use HTTPS in production
   - Set up proper database credentials

2. **Server Security:**
   - Use a reverse proxy (nginx/Apache)
   - Implement rate limiting
   - Set up monitoring and alerting
   - Regular security scans

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - Implement backup and recovery
   - Set up data retention policies
   - Monitor for data breaches

## 🔍 Security Monitoring

### **Log Monitoring**

The application logs security-relevant events:

- Authentication attempts (success/failure)
- File uploads
- Admin actions
- Error patterns
- Suspicious activities

### **Security Headers**

All responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### **Input Validation**

All inputs are validated against:

- Type checking
- Length limits
- Format validation
- Content sanitization
- XSS prevention

## 🛠️ Security Tools

### **Built-in Security Scripts**

```bash
# Set up secure environment
npm run setup

# Run security check
npm run security-check

# Run comprehensive security test
npm run test-security
```

### **Security Utilities**

- `jwtUtils.ts`: Secure JWT handling
- `corsUtils.ts`: Secure CORS configuration
- `fileUtils.ts`: Secure file upload handling
- `validationUtils.ts`: Input validation and sanitization
- `errorHandler.ts`: Secure error handling
- `envConfig.ts`: Environment validation

## 🚨 Incident Response

### **Security Incident Checklist**

1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve evidence
   - Notify stakeholders
   - Assess impact

2. **Investigation:**
   - Review logs
   - Identify root cause
   - Document findings
   - Implement fixes

3. **Recovery:**
   - Restore from backups
   - Update security measures
   - Monitor for recurrence
   - Update documentation

### **Contact Information**

For security issues:
- Review logs in `backend/logs/`
- Check error responses for request IDs
- Monitor application metrics
- Contact development team

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [CORS Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 🔄 Security Updates

This security documentation is updated regularly. Check for updates:

1. Review security advisories
2. Update dependencies
3. Run security checks
4. Review and update this document

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular monitoring, updates, and vigilance are essential for maintaining a secure application.
