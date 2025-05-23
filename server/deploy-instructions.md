# Backend Deployment Instructions

This document provides step-by-step instructions for deploying the backend server to a hosting service like Render, Railway, or Heroku.

## Prerequisites

- A GitHub account
- A Render, Railway, or Heroku account
- A MySQL database (either self-hosted or using a service like PlanetScale, AWS RDS, etc.)

## Step 1: Prepare Your Database

1. **Set up a MySQL database**:
   - If using a managed service like PlanetScale:
     - Create an account at [PlanetScale](https://planetscale.com/)
     - Create a new database named `gudang1`
     - Create a database password
     - Note the connection details (host, username, password)

   - If using AWS RDS:
     - Create an RDS MySQL instance
     - Configure security groups to allow connections from your backend server
     - Note the connection details (host, username, password)

2. **Import your existing data**:
   - Export your local database:
     ```
     mysqldump -u root -p gudang1 > gudang1_backup.sql
     ```
   - Import to your new database (specific steps depend on your provider)

## Step 2: Deploy to Render

1. **Sign up for Render**:
   - Create an account at [Render](https://render.com/)

2. **Create a new Web Service**:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your project

3. **Configure the service**:
   - Name: `gudang1-api` (or any name you prefer)
   - Root Directory: `server` (since your backend is in the server folder)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Set environment variables**:
   - Click on "Environment" and add the following variables:
     ```
     DB_HOST=your-database-host
     DB_USER=your-database-user
     DB_PASSWORD=your-database-password
     DB_NAME=gudang1
     DB_PORT=3306
     PORT=10000
     NODE_ENV=production
     CORS_ORIGIN=https://your-netlify-app.netlify.app
     ```
   - Replace the values with your actual database connection details
   - For CORS_ORIGIN, use the URL of your Netlify app (you'll get this after deploying to Netlify)

5. **Deploy the service**:
   - Click "Create Web Service"
   - Render will build and deploy your application
   - Note the URL of your deployed service (e.g., `https://gudang1-api.onrender.com`)

## Step 3: Deploy to Railway (Alternative)

1. **Sign up for Railway**:
   - Create an account at [Railway](https://railway.app/)

2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub repository
   - Select the repository containing your project

3. **Configure the service**:
   - Set the root directory to `server`
   - Set the start command to `npm start`

4. **Set environment variables**:
   - Go to the "Variables" tab
   - Add the same environment variables as listed in the Render section

5. **Deploy the service**:
   - Railway will automatically deploy your application
   - Note the URL of your deployed service

## Step 4: Deploy to Heroku (Alternative)

1. **Sign up for Heroku**:
   - Create an account at [Heroku](https://www.heroku.com/)

2. **Install the Heroku CLI**:
   - Download and install from [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

3. **Login to Heroku**:
   ```
   heroku login
   ```

4. **Create a new Heroku app**:
   ```
   cd server
   heroku create gudang1-api
   ```

5. **Set environment variables**:
   ```
   heroku config:set DB_HOST=your-database-host
   heroku config:set DB_USER=your-database-user
   heroku config:set DB_PASSWORD=your-database-password
   heroku config:set DB_NAME=gudang1
   heroku config:set DB_PORT=3306
   heroku config:set NODE_ENV=production
   heroku config:set CORS_ORIGIN=https://your-netlify-app.netlify.app
   ```

6. **Deploy to Heroku**:
   ```
   git subtree push --prefix server heroku main
   ```

7. **Note the URL of your deployed service**:
   ```
   heroku open
   ```

## Testing Your Deployment

1. **Test the API endpoint**:
   - Open your browser and navigate to `https://your-backend-url.com/api/test-connection`
   - You should see a JSON response indicating a successful database connection

2. **Check the logs**:
   - In Render: Go to your service and click on "Logs"
   - In Railway: Go to your service and click on "Logs"
   - In Heroku: Run `heroku logs --tail`

## Troubleshooting

1. **Database connection issues**:
   - Ensure your database allows connections from your backend server
   - Check that your environment variables are set correctly
   - Verify that your database credentials are correct

2. **Application errors**:
   - Check the logs for error messages
   - Ensure all dependencies are installed correctly
   - Verify that your start command is correct

3. **CORS issues**:
   - Ensure the CORS_ORIGIN environment variable is set to your frontend URL
   - Check for any CORS-related errors in your browser console
