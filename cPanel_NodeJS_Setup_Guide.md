# cPanel Node.js Application Setup Guide

## 📋 Complete Configuration for Exeloka Backend

Follow this step-by-step guide to configure your Node.js application in cPanel for the Exeloka Cultural Wisdom Recommendation System.

---

## 🖥️ Form Configuration

### **1. Node.js Version**
**Select:** `18.20.4` or `20.15.1` (choose the latest available)
```
Recommended: Node.js 20.x.x for optimal performance
```

### **2. Application Mode**
**Select:** `Production`
```
This automatically sets NODE_ENV=production
Enables production optimizations and security
```

### **3. Application Root**
**Enter exactly:**
```
/home/forresto/public_html/backend
```
> This is the physical server path where your compiled Node.js files are located

### **4. Application URL**
- **Domain:** Select `forrestofus.com` from dropdown
- **Path:** Enter `api`
- **Result:** `https://forrestofus.com/api`

```
Final API URL: https://forrestofus.com/api
All endpoints will be accessible under this URL
```

### **5. Application Startup File**
**Enter:**
```
server.js
```
> This is the main entry point (compiled from TypeScript)

---

## 🔐 Environment Variables

Click "**Add variable**" for each of the following:

### **Core Application Variables**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | `3001` | Backend server port |

### **Authentication & Security**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `JWT_SECRET` | `ExelokaSecureJWT2024!ForSampangWisdom#CulturalAI` | JWT token signing secret |
| `JWT_REFRESH_SECRET` | `ExelokaRefresh2024!SampangCultural#WisdomAI` | JWT refresh token secret |
| `JWT_EXPIRES_IN` | `24h` | Access token expiration |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiration |

### **Database Configuration**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `DB_HOST` | `localhost` | MySQL database host |
| `DB_USER` | `forresto_exeloka` | Database username |
| `DB_PASSWORD` | `ExelokaDB2024#Secure` | Database password |
| `DB_NAME` | `forresto_exeloka` | Database name |
| `DB_PORT` | `3306` | MySQL port (default) |

### **CORS & Frontend Integration**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `FRONTEND_URL` | `https://forrestofus.com` | Frontend URL for CORS |
| `ALLOWED_ORIGINS` | `https://forrestofus.com,https://www.forrestofus.com` | Allowed CORS origins |

### **File & Upload Configuration**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `UPLOAD_PATH` | `/home/forresto/public_html/uploads` | File upload directory |
| `DOCUMENTS_PATH` | `/home/forresto/public_html/generated_documents` | Generated documents path |
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB in bytes) |

### **AI & External Services (Optional)**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-your-actual-api-key-here` | OpenRouter API for AI features |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OCR_SPACE_API_KEY` | `your-ocr-space-api-key` | OCR.space API key |

### **Application Configuration**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `LOG_LEVEL` | `info` | Logging level |
| `RATE_LIMIT_WINDOW` | `900000` | Rate limit window (15 minutes) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

---

## 🚀 Post-Setup Verification

After creating the application, verify these endpoints:

### **Health Check**
```
GET https://forrestofus.com/api/health
Expected Response: {"status": "ok", "timestamp": "..."}
```

### **Authentication Endpoints**
```
POST https://forrestofus.com/api/auth/register
POST https://forrestofus.com/api/auth/login
```

### **API Documentation**
```
GET https://forrestofus.com/api/
Expected: API documentation or welcome message
```

---

## 📁 File Structure Verification

Ensure your backend files are properly placed:

```
/home/forresto/public_html/backend/
├── server.js                 # Main entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (backup)
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── types/
└── utils/
```

---

## 🔧 Troubleshooting

### **Common Issues:**

1. **App won't start:** Check that `server.js` exists in the application root
2. **Database errors:** Verify database credentials and ensure `forresto_exeloka` database exists  
3. **CORS issues:** Ensure `FRONTEND_URL` matches your domain exactly
4. **File upload issues:** Check that upload directories have proper permissions

### **Log Access:**
- Check cPanel Node.js logs for startup errors
- Monitor application logs through cPanel interface

### **Performance:**
- Production mode enables automatic optimizations
- Monitor memory usage through cPanel

---

## 📝 Notes

- **Security:** All secrets use strong, unique values for production
- **Database:** Ensure the database `forresto_exeloka` is created with proper tables
- **SSL:** Application assumes HTTPS is configured for your domain
- **Backup:** Keep a copy of environment variables in a secure location
- **Updates:** Restart the application after any configuration changes

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database created and accessible
- [ ] Domain SSL certificate active
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] Frontend can connect to API
- [ ] File upload directories exist with proper permissions
- [ ] All API endpoints returning expected responses

---

**Setup Date:** $(date)  
**Application:** Exeloka Cultural Wisdom Recommendation System  
**Domain:** https://forrestofus.com  
**API Base:** https://forrestofus.com/api