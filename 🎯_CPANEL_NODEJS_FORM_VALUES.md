# 🎯 cPanel Node.js Setup Form - EXACT VALUES

## 📋 Form Fields & Values

### 1. **Node.js Version**
```
18.x (Latest LTS) or 20.x (Latest LTS)
```
*Choose the highest available LTS version in the dropdown*

### 2. **Application Mode**
```
Production
```
*This automatically sets NODE_ENV=production*

### 3. **Application Root**
```
/home/username/exeloka_backend
```
*Replace "username" with your actual cPanel username*
*This is where you'll upload the backend folder contents*

### 4. **Application URL**
```
https://www.forrestofus.com/api
```
*This will be your backend API endpoint for the ROOT DOMAIN deployment*

### 5. **Application Startup File**
```
server.js
```
*This is the main entry point from your backend package.json*

---

## 📂 After Creating the App

### Step 1: Upload Backend Files
1. **Go to the Application Root** directory created by Node.js app
2. **Upload all contents** from the `backend/` folder in your ZIP
3. **File structure should look like:**
```
/home/username/exeloka_backend/
├── server.js              # Main startup file
├── package.json           # Dependencies
├── src/                   # Source code
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── services/
├── .env.production        # Environment variables
└── node_modules/          # (created after npm install)
```

### Step 2: Install Dependencies
In cPanel Node.js app interface:
1. Click **"NPM Install"** button
2. Wait for installation to complete

### Step 3: Environment Variables
Add these in the Node.js app **Environment Variables** section:
```
NODE_ENV=production
DB_HOST=localhost
DB_USER=forresto_exeloka_user
DB_PASSWORD=Kmzways1a7!!!@@@
DB_NAME=forresto_exeloka
OPENROUTER_API_KEY=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
JWT_SECRET=exeloka-super-secure-jwt-key-forresto-2024-prod
FRONTEND_URL=https://www.forrestofus.com
PORT=3000
```

### Step 4: Start Application
1. Click **"Start App"** button
2. Your API will be available at: **https://www.forrestofus.com/api**

---

## 🔧 Frontend Configuration Update

After backend is running, update your frontend to use the new API:

### Update next.config.js:
```javascript
env: {
  NEXT_PUBLIC_API_URL: 'https://www.forrestofus.com/api',
},
```

### Rebuild Frontend:
1. Run `npm run build` in frontend folder
2. Re-upload the `dist/` folder contents to `public_html/exeloka/`

---

## ✅ Final Architecture

```
Your Hosting (ROOT DOMAIN):
├── public_html/             # Frontend (Static Files) - ROOT DOMAIN
│   └── https://www.forrestofus.com/
├── exeloka_backend/         # Backend (Node.js App)
│   └── https://www.forrestofus.com/api
└── forresto_exeloka         # Database (MySQL)
```

## 🎉 Complete Setup

1. **Frontend:** https://www.forrestofus.com/ ✅ ROOT DOMAIN
2. **Backend API:** https://www.forrestofus.com/api  
3. **Database:** forresto_exeloka (MySQL)

**Everything hosted on your own cPanel at the ROOT DOMAIN!**