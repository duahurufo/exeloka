# Render Deployment Guide - Exeloka Application

## 🚀 Complete Render.com Deployment Setup

### 📋 Prerequisites

1. **GitHub Repository** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Database** - We'll use Render's PostgreSQL or external MySQL

---

## 🔧 Backend Deployment (Node.js Web Service)

### **1. Create New Web Service**

1. Go to Render Dashboard → **New** → **Web Service**
2. **Connect GitHub Repository** containing your backend code
3. **Service Configuration:**

| Field | Value |
|-------|-------|
| **Name** | `exeloka-backend` |
| **Region** | `Ohio (US East)` or closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or `Starter $7/month` for better performance) |

### **2. Environment Variables**

Add these in Render Dashboard → Service → Environment:

```env
NODE_ENV=production
PORT=10000

# JWT Configuration
JWT_SECRET=ExelokaSecureJWT2024!ForSampangWisdom#CulturalAI
JWT_REFRESH_SECRET=ExelokaRefresh2024!SampangCultural#WisdomAI
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration (MySQL - External)
DB_HOST=your-mysql-host.com
DB_USER=your-db-username
DB_PASSWORD=your-secure-password
DB_NAME=exeloka_production
DB_PORT=3306

# CORS & Frontend Integration
FRONTEND_URL=https://exeloka-frontend.onrender.com
ALLOWED_ORIGINS=https://exeloka-frontend.onrender.com,https://forrestofus.com

# File Upload Configuration
UPLOAD_PATH=/tmp/uploads
DOCUMENTS_PATH=/tmp/generated_documents
MAX_FILE_SIZE=10485760

# External Services (Optional)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OCR_SPACE_API_KEY=your-ocr-space-api-key

# Application Configuration
LOG_LEVEL=info
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

## 🌐 Frontend Deployment (Static Site)

### **1. Create Static Site**

1. Render Dashboard → **New** → **Static Site**
2. **Connect same GitHub repository**
3. **Site Configuration:**

| Field | Value |
|-------|-------|
| **Name** | `exeloka-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `out` or `dist` (check your Next.js config) |

### **2. Frontend Environment Variables**

```env
NEXT_PUBLIC_API_URL=https://exeloka-backend.onrender.com/api
NODE_ENV=production
```

---

## 🗄️ Database Options

### **Option 1: Render PostgreSQL (Recommended)**

1. Render Dashboard → **New** → **PostgreSQL**
2. **Database Configuration:**
   - **Name:** `exeloka-database`
   - **Database:** `exeloka`
   - **User:** `exeloka_user`
   - **Region:** Same as your backend
   - **Plan:** `Free` (1GB storage)

3. **Update Backend Environment Variables:**
```env
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_USER=exeloka_user
DB_PASSWORD=auto-generated-password
DB_NAME=exeloka
DB_PORT=5432
DATABASE_URL=postgresql://exeloka_user:password@host:5432/exeloka
```

4. **Update Database Code:**
   - Install PostgreSQL driver: `npm install pg @types/pg`
   - Update database configuration to use PostgreSQL instead of MySQL

### **Option 2: External MySQL (PlanetScale/Railway)**

Keep your existing MySQL configuration and use a cloud MySQL service:
- **PlanetScale:** Free tier with MySQL
- **Railway:** $5/month MySQL
- **Aiven:** Free tier MySQL

---

## 📁 Required File Updates

### **1. Update package.json (Backend)**

Ensure your backend package.json has:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "postbuild": "cp -r src/public dist/ || true"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### **2. Create render.yaml (Optional)**

Create `render.yaml` in project root for Infrastructure as Code:

```yaml
services:
  - type: web
    name: exeloka-backend
    runtime: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    
  - type: web
    name: exeloka-frontend
    runtime: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/out
    envVars:
      - key: NODE_ENV
        value: production
        
databases:
  - name: exeloka-database
    databaseName: exeloka
    user: exeloka_user
```

---

## 🚀 Deployment Steps

### **1. Prepare Code**

```bash
# Create Git repository if not exists
git init
git add .
git commit -m "Initial deployment to Render"
git branch -M main
git remote add origin https://github.com/yourusername/exeloka.git
git push -u origin main
```

### **2. Deploy Backend**

1. Create Web Service in Render
2. Connect GitHub repository
3. Configure build/start commands
4. Add environment variables
5. Deploy

### **3. Deploy Frontend**

1. Create Static Site in Render
2. Connect same GitHub repository
3. Configure build command and publish directory
4. Update `NEXT_PUBLIC_API_URL` to your backend URL
5. Deploy

### **4. Setup Database**

1. Create PostgreSQL database in Render
2. Update backend environment variables
3. Run database migrations (if any)

---

## ✅ Verification

After deployment, test these endpoints:

### **Backend (API)**
```
https://exeloka-backend.onrender.com/health
https://exeloka-backend.onrender.com/api/auth/register
https://exeloka-backend.onrender.com/api/projects
```

### **Frontend**
```
https://exeloka-frontend.onrender.com
```

---

## 💡 Render Benefits

✅ **Free Tier Available** - Perfect for testing
✅ **Auto HTTPS** - SSL certificates included
✅ **GitHub Integration** - Auto-deploy on push
✅ **Environment Variables** - Secure config management
✅ **Logs & Monitoring** - Built-in observability
✅ **PostgreSQL Included** - Free 1GB database
✅ **No Server Management** - Fully managed platform

---

## 🔧 Troubleshooting

### **Common Issues:**

1. **Build Fails:**
   - Check build command in service settings
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **Service Won't Start:**
   - Verify start command
   - Check environment variables
   - Review application logs

3. **Database Connection:**
   - Verify database URL format
   - Check firewall settings
   - Test connection string

### **Performance Tips:**

- Use Starter plan ($7/month) for better performance
- Enable CDN for static assets
- Configure proper logging levels
- Monitor memory usage

---

## 💰 Cost Estimation

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Web Service** | 750 hours/month | $7/month (Starter) |
| **Static Site** | Unlimited | Free |
| **PostgreSQL** | 1GB storage | $7/month (1GB) |
| **Total** | **FREE** | **$14/month** |

---

**Ready to deploy!** 🎉

The Free tier is perfect for development and testing. Upgrade to paid plans when you need more resources or go live with production traffic.