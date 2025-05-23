# 📁 Step-by-Step GitHub Repository Setup

## 🎯 **What You Need to Do**

Follow these exact steps to create your GitHub repository and deploy the backend:

---

## **Step 1: Create GitHub Repository**

### 1.1 Go to GitHub
- Open [github.com](https://github.com) in your browser
- Sign in to your GitHub account

### 1.2 Create New Repository
- Click the **"+"** button in the top right corner
- Select **"New repository"**

### 1.3 Repository Settings
- **Repository name**: `gudang-mitra` (or your preferred name)
- **Description**: `Professional 3D Inventory Management System`
- **Visibility**: Choose **Public** or **Private**
- ✅ **Check "Add a README file"**
- **Click "Create repository"**

---

## **Step 2: Prepare Your Local Files**

### 2.1 Open Command Prompt/Terminal
```bash
# Navigate to your project directory
cd "C:\Users\nugro\Downloads\pastibisa\1\project"
```

### 2.2 Initialize Git (if not already done)
```bash
# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Professional 3D Inventory Management System with 3D design"
```

### 2.3 Connect to GitHub Repository
```bash
# Replace YOUR_USERNAME with your GitHub username
# Replace gudang-mitra with your repository name if different
git remote add origin https://github.com/YOUR_USERNAME/gudang-mitra.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## **Step 3: Deploy Backend to Railway**

### 3.1 Go to Railway Dashboard
- Open [railway.app](https://railway.app)
- Sign in to your Railway account
- Go to your existing project (the one with MySQL database)

### 3.2 Add Backend Service
- In your Railway project dashboard
- Click **"+ New"** button
- Select **"GitHub Repo"**
- Choose your newly created repository
- **Important**: Set **Root Directory** to `server`

### 3.3 Configure Environment Variables
Add these environment variables in Railway:

```
DB_HOST=nozomi.proxy.rlwy.net
DB_PORT=21817
DB_USER=root
DB_PASSWORD=pvOcQbzlDAobtcdozbMvCdIDDEmenwkO
DB_NAME=railway
DB_SSL=false
PORT=3002
NODE_ENV=production
CORS_ORIGIN=https://gudang-mitra-app.netlify.app
```

### 3.4 Deploy
- Railway will automatically build and deploy your backend
- Wait for deployment to complete
- **Copy the new backend URL** (something like `https://your-app-name.up.railway.app`)

---

## **Step 4: Update Frontend Configuration**

### 4.1 Update API URL
```bash
# In your project directory, update the production environment
echo "VITE_API_URL=https://your-new-backend-url.up.railway.app" > .env.production
```

### 4.2 Rebuild and Redeploy Frontend
```bash
# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## **Step 5: Test Your Application**

### 5.1 Test Backend
- Open your new Railway backend URL in browser
- Add `/api/test-connection` to test database connection
- Should return: `{"success": true, "message": "Database connection successful"}`

### 5.2 Test Frontend
- Go to https://gudang-mitra-app.netlify.app
- Try logging in with test accounts:
  - **Manager**: manager@gudangmitra.com / password123
  - **User**: bob@gudangmitra.com / password123

---

## **🎉 Expected Results**

After completing all steps:

✅ **GitHub Repository**: Your code is safely stored and version controlled
✅ **Railway Backend**: API server running and connected to database
✅ **Netlify Frontend**: Professional 3D application deployed and working
✅ **Database**: Railway MySQL active and populated with data
✅ **Authentication**: Login system working with real user accounts
✅ **Full Functionality**: All features working (dashboard, inventory, requests)

---

## **📋 Quick Checklist**

- [ ] GitHub repository created
- [ ] Local code pushed to GitHub
- [ ] Railway backend service deployed
- [ ] Environment variables configured
- [ ] Frontend updated with new backend URL
- [ ] Frontend redeployed to Netlify
- [ ] Application tested and working

---

## **🚨 Troubleshooting**

### If Backend Deployment Fails:
1. Check that Root Directory is set to `server`
2. Verify all environment variables are correct
3. Check Railway build logs for errors

### If Frontend Can't Connect:
1. Verify backend URL is correct in `.env.production`
2. Check CORS_ORIGIN matches Netlify URL
3. Ensure backend is responding to API calls

### If Login Doesn't Work:
1. Test backend `/api/auth/login` endpoint directly
2. Check browser console for errors
3. Verify database connection is working

---

## **📞 Next Steps After Setup**

Once everything is working:
1. **Test all features** (login, dashboard, inventory, requests)
2. **Share the application** with users
3. **Monitor performance** through Railway and Netlify dashboards
4. **Make updates** by pushing to GitHub (auto-deploys)

Your professional inventory management system will be fully operational! 🚀
