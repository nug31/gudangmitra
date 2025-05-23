# Deployment Checklist

Use this checklist to track your progress through the deployment process.

## Preparation

- [ ] Review the deployment instructions in README.md
- [ ] Run `node prepare-deploy.js` to prepare your application for deployment
- [ ] Update environment variables in `.env.production` with your backend URL
- [ ] Update environment variables in `server/.env` with your database credentials
- [ ] Export your database using `node server/export-database.js`

## Database Deployment

- [ ] Choose a database hosting provider (PlanetScale, AWS RDS, etc.)
- [ ] Create a new MySQL database named `gudang1`
- [ ] Configure database access (users, permissions, etc.)
- [ ] Import your database schema and data
- [ ] Test database connection

## Backend Deployment

- [ ] Choose a backend hosting provider (Render, Railway, Heroku, etc.)
- [ ] Create a new service/application
- [ ] Configure environment variables:
  - [ ] DB_HOST
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_NAME
  - [ ] DB_PORT
  - [ ] PORT
  - [ ] NODE_ENV=production
  - [ ] CORS_ORIGIN (set to your Netlify URL once deployed)
- [ ] Deploy the backend code
- [ ] Test the backend API:
  - [ ] Visit `/api/test-connection` to verify database connection
  - [ ] Check logs for any errors

## Frontend Deployment

- [ ] Create a Netlify account if you don't have one
- [ ] Connect your GitHub repository to Netlify
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`
- [ ] Set environment variables:
  - [ ] VITE_API_URL (set to your backend URL)
- [ ] Deploy the frontend
- [ ] Test the deployed application

## Post-Deployment

- [ ] Update CORS settings on the backend to include your Netlify URL
- [ ] Test login functionality
- [ ] Test request creation and approval
- [ ] Verify that item quantities are updated correctly
- [ ] Check for any console errors

## Optional Steps

- [ ] Set up a custom domain in Netlify
- [ ] Configure SSL for your custom domain
- [ ] Set up continuous deployment
- [ ] Configure monitoring and alerts
- [ ] Set up database backups

## Troubleshooting

If you encounter issues during deployment, check the following:

1. **Database connection issues**:
   - Verify database credentials
   - Check that your database allows connections from your backend server
   - Look for connection errors in the backend logs

2. **Backend deployment issues**:
   - Check environment variables
   - Review server logs for errors
   - Verify that all dependencies are installed

3. **Frontend deployment issues**:
   - Check build logs in Netlify
   - Verify that the API URL is set correctly
   - Look for CORS errors in the browser console

4. **Application functionality issues**:
   - Test each feature individually
   - Check browser console for errors
   - Verify that API requests are being sent to the correct URL
