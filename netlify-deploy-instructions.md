# Frontend Deployment Instructions for Netlify

This document provides step-by-step instructions for deploying the frontend application to Netlify.

## Prerequisites

- A GitHub account
- A Netlify account
- Your backend API already deployed (see server/deploy-instructions.md)

## Step 1: Prepare Your Repository

1. **Ensure your repository is up to date**:
   - Commit all your changes to your GitHub repository
   - Make sure the `netlify.toml` file is in the root directory
   - Verify that `.env.production` is set up correctly

2. **Update the production API URL**:
   - Edit the `.env.production` file to point to your deployed backend:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```
   - Replace `https://your-backend-url.com` with the actual URL of your deployed backend

## Step 2: Deploy to Netlify

### Option 1: Deploy via Netlify UI

1. **Sign up for Netlify**:
   - Create an account at [Netlify](https://www.netlify.com/)

2. **Create a new site**:
   - Click "New site from Git"
   - Select GitHub as your Git provider
   - Authorize Netlify to access your GitHub account
   - Select your repository

3. **Configure build settings**:
   - Owner: Your Netlify team
   - Branch to deploy: `main` (or your default branch)
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Set environment variables**:
   - Click "Advanced build settings"
   - Add the environment variable:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```
   - Replace with your actual backend URL

5. **Deploy the site**:
   - Click "Deploy site"
   - Netlify will build and deploy your application
   - Once complete, you'll get a URL like `https://your-app.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install the Netlify CLI**:
   ```
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```
   netlify login
   ```

3. **Initialize your site**:
   ```
   netlify init
   ```
   - Follow the prompts to create a new site or link to an existing one

4. **Set environment variables**:
   ```
   netlify env:set VITE_API_URL https://your-backend-url.com
   ```

5. **Deploy your site**:
   ```
   netlify deploy --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. **Add a custom domain**:
   - Go to your site settings in Netlify
   - Click on "Domain settings"
   - Click "Add custom domain"
   - Enter your domain name and follow the instructions

2. **Set up DNS**:
   - If you purchased a domain through Netlify, DNS is automatically configured
   - If you're using an external domain, you'll need to configure your DNS settings:
     - Add a CNAME record pointing to your Netlify site
     - Or update your nameservers to Netlify's nameservers

3. **Enable HTTPS**:
   - Netlify automatically provisions SSL certificates via Let's Encrypt
   - Ensure "HTTPS" is enabled in your domain settings

## Step 4: Update CORS Settings on Backend

1. **Update the CORS configuration**:
   - Go to your backend deployment settings
   - Update the CORS_ORIGIN environment variable to include your Netlify URL:
     ```
     CORS_ORIGIN=https://your-app.netlify.app
     ```
   - If you're using a custom domain, also include that:
     ```
     CORS_ORIGIN=https://your-app.netlify.app,https://your-custom-domain.com
     ```

## Testing Your Deployment

1. **Test the application**:
   - Open your browser and navigate to your Netlify URL
   - Try logging in and performing various operations
   - Check that data is being fetched from and saved to the database

2. **Check for errors**:
   - Open the browser developer console (F12)
   - Look for any errors, especially related to API calls
   - Verify that the API URL is correct

## Troubleshooting

1. **Build failures**:
   - Check the build logs in Netlify
   - Ensure all dependencies are correctly specified in package.json
   - Verify that your build command is correct

2. **API connection issues**:
   - Confirm that your backend is running and accessible
   - Check that the VITE_API_URL environment variable is set correctly
   - Verify that CORS is properly configured on your backend

3. **Routing issues**:
   - Ensure the `netlify.toml` file contains the correct redirect rules
   - Check that your React Router configuration works with Netlify's routing

4. **Environment variable issues**:
   - Verify that environment variables are correctly set in Netlify
   - Remember that changes to environment variables require a redeployment
