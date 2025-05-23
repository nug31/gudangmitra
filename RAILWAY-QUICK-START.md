# Railway MySQL Quick Start Guide

## Step 1: Create Railway Account (5 minutes)

1. **Go to**: https://railway.app/
2. **Click "Start a New Project"**
3. **Sign up with GitHub** (recommended) or email
4. **You'll get $5/month free credits** (no credit card needed initially)

## Step 2: Create MySQL Database (3 minutes)

1. **Click "New Project"**
2. **Select "Provision MySQL"** (NOT "Deploy from GitHub")
3. **Wait for deployment** (2-3 minutes)
4. **Your MySQL service will be ready**

## Step 3: Get Connection Details (2 minutes)

1. **Click on your MySQL service** in the Railway dashboard
2. **Go to "Variables" tab**
3. **Copy these values** (you'll need them):

```
MYSQL_HOST=containers-us-west-xxx.railway.app
MYSQL_PORT=6543 (or similar)
MYSQL_USER=root
MYSQL_PASSWORD=generated-password-here
MYSQL_DATABASE=railway
```

## Step 4: Test Connection

Once you have the connection details:

1. **Come back to this terminal**
2. **Type 'y' when asked if you have connection details**
3. **Enter the connection details when prompted**
4. **The script will configure everything for you**

## Alternative: Manual Configuration

If you prefer to configure manually, update `server/.env`:

```env
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=your-generated-password
DB_NAME=railway
DB_SSL=false
```

## Why Railway is Better than db4free.net:

✅ **Reliable**: Professional infrastructure
✅ **Fast**: Much better performance
✅ **$5/month credits**: Enough for database + backend
✅ **Easy setup**: Simple dashboard
✅ **SSL support**: Secure connections
✅ **Automatic backups**: Data protection
✅ **Can host backend too**: One platform for everything

## Cost Breakdown:

- **MySQL Database**: ~$2-3/month
- **Remaining credits**: Can be used for backend hosting
- **Total cost**: $0 for several months with free credits

## Next Steps:

1. **Set up Railway** (follow steps above)
2. **Get connection details**
3. **Come back to terminal** and continue setup
4. **Test connection and migrate data**

---

**Ready?** Go to https://railway.app/ and create your account now!
