# AWS RDS Deployment Checklist

## Configuration Details
- **RDS Endpoint**: 
- **Database**: gudang1
- **Username**: admin
- **Backend URL**: 
- **Frontend URL**: 

## Pre-Deployment Steps
- [ ] AWS RDS instance is created and running
- [ ] Security group allows inbound connections on port 3306
- [ ] Database credentials are correct
- [ ] Local database has been exported

## Database Migration
- [ ] Run: `cd server && node migrate-to-aws-rds.js`
- [ ] Import data to AWS RDS using the generated SQL files
- [ ] Test connection: `cd server && node test-aws-rds.js`

## Backend Deployment (Render/Railway/Heroku)
- [ ] Create new web service
- [ ] Set root directory to "server"
- [ ] Configure environment variables from server/.env.production
- [ ] Deploy and test API endpoints

## Frontend Deployment (Netlify)
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Configure environment variable: `VITE_API_URL=`
- [ ] Deploy and test application

## Post-Deployment
- [ ] Update CORS settings with actual frontend URL
- [ ] Test login functionality
- [ ] Test request creation and approval
- [ ] Verify database operations work correctly

## Testing URLs
- Backend API: /api/test-connection
- Frontend App: 
