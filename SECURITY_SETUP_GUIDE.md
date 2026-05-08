# Production-Grade Rate Limiting Implementation Guide

This guide provides comprehensive documentation for the security middleware implementation, including setup instructions, configuration options, deployment guidelines, and best practices.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Integration](#integration)
7. [Rate Limiting Rules](#rate-limiting-rules)
8. [Redis Setup](#redis-setup)
9. [Production Deployment](#production-deployment)
10. [Monitoring](#monitoring)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

## Overview

This implementation provides enterprise-grade rate limiting and security middleware for your LMS backend. It includes:

- **Multi-layer rate limiting**: IP-based, email+IP-based, and user-based
- **Progressive delays**: Automatic slowdown for repeated failed attempts
- **Security headers**: Helmet configuration for HTTP security
- **Security logging**: Centralized logging for security events
- **Redis-ready**: Easy migration to distributed rate limiting
- **Environment-aware**: Different configurations for dev/staging/prod

## Architecture

### Components

```
src/
├── config/
│   └── security.js              # Centralized security configuration
├── middlewares/
│   └── security/
│       ├── rateLimiter.js      # Rate limiting middleware
│       ├── slowDown.js         # Progressive delay middleware
│       ├── helmet.js           # Security headers middleware
│       └── securityLogger.js   # Security event logging
└── Routes/
    └── Auth.Routes.js          # Auth routes with rate limiters applied
```

### Data Flow

```
Request → Rate Limiter → Slow Down → Controller → Response
                ↓              ↓
          Security Logger  Security Logger
```

## Folder Structure

```
acewall-school-BE/
├── src/
│   ├── config/
│   │   └── security.js              # Security configuration
│   ├── middlewares/
│   │   ├── security/
│   │   │   ├── rateLimiter.js      # Rate limiters
│   │   │   ├── slowDown.js         # Slow down middleware
│   │   │   ├── helmet.js           # Security headers
│   │   │   └── securityLogger.js   # Security logging
│   │   └── Auth.Middleware.js      # Existing auth middleware
│   ├── Routes/
│   │   └── Auth.Routes.js          # Updated with rate limiters
│   └── Contollers/
│       └── auth.controller.js      # Updated with security logging
├── .env.example                    # Updated with security variables
├── SECURITY_DEPENDENCIES.md        # Installation guide
└── SECURITY_SETUP_GUIDE.md         # This file
```

## Installation

### Step 1: Install Dependencies

```bash
# Basic installation (memory store)
npm install express-rate-limit express-slow-down helmet

# With Redis support (recommended for production)
npm install express-rate-limit express-slow-down helmet rate-limit-redis
```

### Step 2: Configure Environment Variables

Copy the security variables from `.env.example` to your `.env` file:

```bash
# Security Configuration
RATE_LIMIT_ENABLED=true
TRUST_PROXY=false
TRUSTED_PROXIES=

# Redis (if using)
REDIS_URL=redis://localhost:6379

# Security Logging
SECURITY_LOGGING_ENABLED=true
SECURITY_LOG_PATH=./logs/security.log

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Configure App-Level Security

In your main app file (e.g., `src/index.js`), add:

```javascript
import express from 'express';
import { createHelmetMiddleware, getCorsConfig } from './middlewares/security/helmet.js';
import cors from 'cors';
import securityConfig from './config/security.js';

const app = express();

// Trust proxy (required for rate limiting behind load balancers)
if (securityConfig.rateLimit.trustProxy) {
  app.set('trust proxy', securityConfig.rateLimit.trustProxy);
}

// Security headers
app.use(createHelmetMiddleware());

// CORS
app.use(cors(getCorsConfig()));

// Body parser limits
app.use(express.json({ limit: securityConfig.requestSizeLimits.json }));
app.use(express.urlencoded({ limit: securityConfig.requestSizeLimits.urlencoded, extended: true }));
```

## Configuration

### Rate Limiting Configuration

Edit `src/config/security.js` to customize rate limits:

```javascript
export const loginRateLimits = {
  ipBased: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 requests per window
  },
  emailIpBased: {
    windowMs: 30 * 60 * 1000,  // 30 minutes
    max: 5,                     // 5 failed attempts
  },
  slowDown: {
    afterAttempts: 3,
    delayAfter: 500,
    maxDelay: 2000,
  },
};
```

### Security Headers Configuration

Customize CSP directives in `src/config/security.js`:

```javascript
export const securityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.example.com"],
      imgSrc: ["'self'", "data:", "https:"],
      // Add your domains here
    },
  },
};
```

## Integration

### Applying Rate Limiters to Routes

Rate limiters are already applied to auth routes in `src/Routes/Auth.Routes.js`:

```javascript
import {
  createLoginLimiter,
  createForgotPasswordLimiter,
  createOtpVerificationLimiter,
  createResendOtpLimiter,
  createRegistrationLimiter,
} from "../middlewares/security/rateLimiter.js";
import {
  createLoginSlowDown,
  createOtpSlowDown,
  createForgotPasswordSlowDown,
} from "../middlewares/security/slowDown.js";

// Login with rate limiting and slow down
router.post("/login", createLoginSlowDown(), createLoginLimiter(), login);

// OTP verification
router.post("/verifyOTP", createOtpSlowDown('email'), createOtpVerificationLimiter('email'), verifyEmailOtp);

// Forgot password
router.post("/forgotPassword", createForgotPasswordSlowDown(), createForgotPasswordLimiter(), forgetPassword);
```

### Adding Security Logging to Controllers

Security logging is integrated into the login controller:

```javascript
import {
  logFailedLogin,
  logSuccessfulLogin,
} from "../middlewares/security/securityLogger.js";

export const login = async (req, res) => {
  try {
    // ... validation logic
    
    if (!user) {
      logFailedLogin(req, 'user_not_found');
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    
    if (!isAuthorized) {
      logFailedLogin(req, 'invalid_password');
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    
    // ... successful login logic
    logSuccessfulLogin(req, user._id);
  } catch (error) {
    logFailedLogin(req, 'server_error');
  }
};
```

## Rate Limiting Rules

### Login Rate Limits

**IP-Based Protection:**
- Window: 15 minutes
- Max requests: 20 per IP
- Purpose: Prevent brute force from single source

**Email+IP Protection:**
- Window: 30 minutes
- Max failed attempts: 5 per email+IP combination
- Block duration: 30 minutes after limit
- Purpose: Prevent distributed credential stuffing

**Progressive Slowdown:**
- After 3 attempts: +500ms delay
- After 5 attempts: +1000ms delay
- After 10 attempts: +2000ms delay (max)
- Purpose: Make automated attacks expensive

### Forgot Password Rate Limits

**IP-Based:**
- Window: 1 hour
- Max requests: 3 per IP

**Email-Based:**
- Window: 1 hour
- Max requests: 3 per email

### OTP Verification Rate Limits

**Email OTP:**
- Window: 10 minutes
- Max attempts: 5 per OTP

**Phone OTP:**
- Window: 10 minutes
- Max attempts: 5 per OTP

### Resend OTP Rate Limits

**Email OTP:**
- Window: 10 minutes
- Max resends: 3

**Phone OTP:**
- Window: 10 minutes
- Max resends: 2 (stricter due to SMS costs)

### Registration Rate Limits

**IP-Based:**
- Window: 1 hour
- Max registrations: 5 per IP

**Email-Based:**
- Window: 24 hours
- Max registrations: 1 per email

## Redis Setup

### Why Use Redis?

Redis is recommended for production deployments because:

- **Distributed rate limiting**: Works across multiple server instances
- **Persistence**: Rate limit data survives server restarts
- **Performance**: Better performance for high-traffic applications
- **Scalability**: Supports horizontal scaling

### Installation

```bash
# Install Redis
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Docker
docker run -d -p 6379:6379 redis
```

### Configuration

Add to your `.env`:

```bash
REDIS_URL=redis://localhost:6379
# Or with authentication
REDIS_URL=redis://username:password@redis-host:6379
```

### Cloud Redis Services

For production, consider managed Redis services:

- **AWS ElastiCache**: https://aws.amazon.com/elasticache/
- **Azure Cache for Redis**: https://azure.microsoft.com/services/cache/
- **Redis Cloud**: https://redis.com/enterprise/
- **Upstash**: https://upstash.com/

### Redis Connection String Examples

```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Redis Cloud
REDIS_URL=redis://default:password@host-12345.redis.cloud.com:6379

# AWS ElastiCache
REDIS_URL=redis://:password@my-cluster.xxxxxx.use1.cache.amazonaws.com:6379
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Install all security dependencies
- [ ] Configure Redis for distributed rate limiting
- [ ] Set `NODE_ENV=production`
- [ ] Set `TRUST_PROXY=true` behind load balancer
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Enable HSTS (HTTPS required)
- [ ] Update CSP directives for production domains
- [ ] Configure log aggregation service
- [ ] Set up monitoring and alerting
- [ ] Test rate limiting in staging environment

### Trust Proxy Configuration

When behind a load balancer (AWS ELB, Nginx, Cloudflare, etc.):

```javascript
// In your main app file
app.set('trust proxy', true);

// Or specify number of proxies
app.set('trust proxy', 2);

// Or specify trusted proxy IPs
app.set('trust proxy', ['10.0.0.0/8', '172.16.0.0/12']);
```

### Environment Variables for Production

```bash
NODE_ENV=production
RATE_LIMIT_ENABLED=true
TRUST_PROXY=true
TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12
REDIS_URL=redis://your-redis-host:6379
SECURITY_LOGGING_ENABLED=true
SECURITY_LOG_PATH=/var/log/app/security.log
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Load Balancer Configuration

Ensure your load balancer forwards the correct headers:

**Nginx:**
```nginx
location / {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**AWS ELB/ALB:**
- Enable X-Forwarded-For headers
- Enable X-Forwarded-Proto header

### HTTPS Configuration

Enable HSTS only with valid HTTPS:

```javascript
// In config/security.js
hsts: isProduction ? {
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true,
} : false,
```

## Monitoring

### Security Log Monitoring

Monitor the security log file for suspicious activity:

```bash
# Tail security logs
tail -f ./logs/security.log

# Search for rate limit exceeded
grep "RATE_LIMIT_EXCEEDED" ./logs/security.log

# Search for failed logins
grep "FAILED_LOGIN" ./logs/security.log

# Search for suspicious activity
grep "SUSPICIOUS_ACTIVITY" ./logs/security.log
```

### Log Aggregation

For production, use log aggregation services:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **CloudWatch** (AWS)
- **Azure Monitor**

### Metrics to Monitor

- Rate limit exceeded events
- Failed login attempts
- Suspicious activity patterns
- Blocked requests
- OTP verification failures
- Password reset requests

### Alerting

Set up alerts for:

- High rate of failed logins (> 10/minute)
- Rate limit exceeded events (> 5/minute)
- Suspicious activity patterns
- Blocked requests from single IP
- Unusual traffic patterns

## Troubleshooting

### Issue: Rate limiting not working

**Possible causes:**
1. `RATE_LIMIT_ENABLED=false` in environment
2. Middleware not applied to routes
3. Trust proxy not configured behind load balancer

**Solution:**
```bash
# Check environment
echo $RATE_LIMIT_ENABLED

# Verify middleware is applied
# Check route definition in Auth.Routes.js

# Check trust proxy
# In your app, add: app.set('trust proxy', true)
```

### Issue: All users blocked behind NAT

**Possible causes:**
1. IP-only rate limiting too aggressive
2. Multiple users sharing same IP

**Solution:**
- Increase IP-based limits in `config/security.js`
- Rely more on email+IP limits
- Consider user-based limits for authenticated endpoints

### Issue: Redis connection errors

**Possible causes:**
1. Redis not running
2. Incorrect `REDIS_URL`
3. Firewall blocking Redis port
4. Redis authentication failure

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Test connection
redis-cli -h your-host -p 6379 ping

# Check firewall
sudo ufw allow 6379
```

### Issue: CSP blocking resources

**Possible causes:**
1. CSP directives too strict
2. CDN domains not whitelisted
3. Inline scripts/styles not allowed

**Solution:**
```javascript
// In config/security.js
contentSecurityPolicy: {
  directives: {
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.example.com"],
    // Add your domains
  },
}
```

### Issue: CORS errors

**Possible causes:**
1. Origin not in `ALLOWED_ORIGINS`
2. Credentials not enabled
3. Preflight request failing

**Solution:**
```bash
# Add your frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Security Best Practices

### 1. Never Expose Security Internals

Always use generic error messages:

```javascript
// ❌ Bad - exposes email existence
if (!user) {
  return res.status(404).json({ message: "Email not found" });
}

// ✅ Good - generic message
if (!user) {
  return res.status(400).json({ message: "Invalid Credentials" });
}
```

### 2. Use HTTPS in Production

Never run rate-limited endpoints over HTTP in production. HTTPS prevents:
- Credential interception
- Token theft
- Man-in-the-middle attacks

### 3. Implement Proper Logging

Log security events but sanitize sensitive data:

```javascript
// ✅ Good - redacts sensitive data
logFailedLogin(req, 'invalid_password');
// Log automatically redacts password, otp, token

// ❌ Bad - logs sensitive data
console.log(`Failed login for ${email} with password ${password}`);
```

### 4. Monitor and Respond

Set up monitoring and alerting to:
- Detect attack patterns early
- Respond to incidents quickly
- Adjust rate limits based on traffic patterns

### 5. Regular Security Audits

- Review rate limit logs monthly
- Adjust limits based on legitimate traffic
- Update CSP directives when adding new resources
- Rotate Redis credentials regularly
- Review trust proxy configuration

### 6. Defense in Depth

Rate limiting is one layer of security. Combine with:
- Strong password policies
- Multi-factor authentication
- Input validation
- Output encoding
- Regular security updates

### 7. Test Before Deploying

- Test rate limiting in staging
- Simulate attack patterns
- Verify legitimate users not blocked
- Test Redis failover
- Monitor performance impact

## Common Mistakes to Avoid

### 1. Blocking All Users Behind NAT

**Mistake:** Using only IP-based limits with strict thresholds.

**Fix:** Use combination of IP and email+IP limits, or user-based limits for authenticated endpoints.

### 2. Exposing Email Existence

**Mistake:** Different error messages for existing vs non-existing emails.

**Fix:** Use generic "Invalid Credentials" for both cases.

### 3. Not Configuring Trust Proxy

**Mistake:** Running behind load balancer without trust proxy configuration.

**Fix:** Set `app.set('trust proxy', true)` when behind load balancer.

### 4. Using Memory Store in Production

**Mistake:** Using memory store with multiple server instances.

**Fix:** Use Redis for distributed rate limiting in production.

### 5. Too Strict CSP

**Mistake:** Blocking legitimate resources with overly strict CSP.

**Fix:** Test CSP in report-only mode first, then add domains as needed.

### 6. Not Monitoring Logs

**Mistake:** Implementing security logging but never reviewing logs.

**Fix:** Set up log aggregation and monitoring with alerts.

### 7. Ignoring Performance Impact

**Mistake:** Not monitoring performance impact of rate limiting.

**Fix:** Monitor response times and adjust limits if needed.

## Support and Resources

### Package Documentation

- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [express-slow-down](https://github.com/express-rate-limit/express-slow-down)
- [helmet](https://github.com/helmetjs/helmet)
- [rate-limit-redis](https://github.com/express-rate-limit/rate-limit-redis)

### Security Resources

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#rate-limiting)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Security Headers](https://securityheaders.com/)

### Additional Documentation

- `SECURITY_DEPENDENCIES.md` - Installation guide
- `.env.example` - Environment variables reference
- `src/config/security.js` - Configuration reference

## Summary

This implementation provides enterprise-grade security middleware for your LMS backend with:

- ✅ Multi-layer rate limiting (IP, email+IP, user-based)
- ✅ Progressive delays for failed attempts
- ✅ Security headers via Helmet
- ✅ Centralized security logging
- ✅ Redis-ready architecture
- ✅ Environment-aware configuration
- ✅ Production-ready defaults
- ✅ Comprehensive documentation

Follow this guide to properly configure, deploy, and monitor the security middleware in your production environment.
