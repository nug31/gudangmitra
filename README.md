# 🏢 Gudang Mitra - Professional Inventory Management System

A modern, professional 3D inventory management system with glassmorphism design, built with React, TypeScript, and Node.js.

## ✨ Features

- 🎨 **Professional 3D Design** - Modern glassmorphism effects and 3D animations
- 🔐 **Authentication System** - Secure login with role-based access (Admin/Manager/User)
- 📊 **Real-time Dashboard** - Live statistics and analytics with 3D cards
- 📦 **Inventory Management** - Complete item tracking and management
- 📋 **Request System** - Item request and approval workflow
- 👥 **User Management** - Role-based user administration
- 📱 **Responsive Design** - Works perfectly on all devices
- 📈 **Excel Export** - Advanced reporting capabilities
- 🌐 **Real Database Integration** - Connected to Railway MySQL database

## 🚀 Live Demo

- **Frontend**: https://gudang-mitra-app.netlify.app
- **Backend**: Railway MySQL Database (Active)

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling with 3D effects)
- Lucide React (Icons)
- React Router (Navigation)
- Professional 3D animations and glassmorphism

### Backend
- Node.js + Express
- MySQL (Railway Database)
- CORS (Cross-origin requests)
- UUID (Unique identifiers)

### Deployment
- **Frontend**: Netlify (Live)
- **Backend**: Railway (Ready to deploy)
- **Database**: Railway MySQL (Active)

## Project Structure

- `/` - Frontend React application
- `/server` - Backend Node.js API

## Deployment Instructions

### Backend Deployment (Server)

1. **Set up a MySQL database**
   - Create a MySQL database named `gudang1` or use your existing database
   - Make sure the database is accessible from your hosting provider
   - For production, use a database hosting service like:
     - [PlanetScale](https://planetscale.com/) (MySQL compatible)
     - [AWS RDS](https://aws.amazon.com/rds/mysql/)
     - [DigitalOcean Managed MySQL](https://www.digitalocean.com/products/managed-databases-mysql)

2. **Deploy the backend to a hosting service**
   - Options include:
     - [Render](https://render.com/)
     - [Railway](https://railway.app/)
     - [Heroku](https://www.heroku.com/)
     - [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)

3. **Set environment variables**
   - Copy `.env.example` to `.env` and update with your database credentials
   - Set these environment variables in your hosting provider's dashboard:
     ```
     DB_HOST=your-database-host
     DB_USER=your-database-user
     DB_PASSWORD=your-database-password
     DB_NAME=gudang1
     DB_PORT=3306
     PORT=3002 (or let the provider set this)
     CORS_ORIGIN=https://your-netlify-app.netlify.app
     ```

### Frontend Deployment (Netlify)

1. **Connect your GitHub repository to Netlify**
   - Sign up for [Netlify](https://www.netlify.com/)
   - Connect your GitHub repository
   - Set the build command to `npm run build`
   - Set the publish directory to `dist`

2. **Set environment variables in Netlify**
   - Go to Site settings > Build & deploy > Environment
   - Add the environment variable:
     ```
     VITE_API_URL=https://your-backend-url.com
     ```

3. **Deploy your site**
   - Trigger a deploy from the Netlify dashboard
   - Your site will be available at a Netlify subdomain (e.g., `your-app.netlify.app`)

## Local Development

1. **Install dependencies**
   ```
   npm install
   cd server
   npm install
   ```

2. **Start the backend server**
   ```
   cd server
   npm run dev
   ```

3. **Start the frontend development server**
   ```
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3002

## Database Configuration

The application uses a MySQL database. Make sure you have MySQL installed and running locally for development, or use a remote MySQL database for production.

## Environment Variables

### Frontend (.env.local or .env.production)
```
VITE_API_URL=http://localhost:3002 (for development)
VITE_API_URL=https://your-backend-url.com (for production)
```

### Backend (.env)
```
DB_HOST=localhost (or your database host)
DB_USER=root (or your database user)
DB_PASSWORD= (your database password)
DB_NAME=gudang1
DB_PORT=3306
PORT=3002
CORS_ORIGIN=http://localhost:5173 (for development)
CORS_ORIGIN=https://your-netlify-app.netlify.app (for production)
OPENAI_API_KEY=your-openai-api-key-here (required for AI chat)
```

## 🤖 AI Chat Setup

The application includes a bilingual AI chat feature that requires an OpenAI API key. See [OPENAI_SETUP.md](OPENAI_SETUP.md) for detailed setup instructions.

**Quick Setup:**
1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY=your-key-here` to your environment variables
3. For Railway: Add the key in your project's Variables tab

## 👥 Test Accounts

- **Manager**: manager@gudangmitra.com / password123
- **User**: bob@gudangmitra.com / password123

## 🎨 Design Features

### Professional 3D Effects
- **Glassmorphism Navigation** - Semi-transparent navbar with backdrop blur
- **3D Dashboard Cards** - Elevated cards with hover animations and depth
- **Floating Animations** - Smooth floating background elements
- **Gradient Text** - Multi-color gradient text effects
- **Enhanced Shadows** - Multi-layered shadow system for depth
- **Interactive Buttons** - 3D button effects with shine animations

### Modern UI Components
- **Loading States** - Professional 3D loading animations
- **Form Elements** - Enhanced inputs with glassmorphism effects
- **Notifications** - 3D notification system with progress indicators
- **Cards** - Multiple variants (default, glass, 3d, floating, neon)

## 📱 Screenshots

The application features a modern, professional design with:
- Clean, intuitive interface
- Smooth animations and transitions
- Responsive layout for all devices
- Professional color scheme
- Advanced 3D visual effects

## 🚀 Quick Start

### For Repository Setup

1. **Create GitHub Repository**:
   ```bash
   # Create new repository on GitHub named 'gudang-mitra'
   git clone https://github.com/YOUR_USERNAME/gudang-mitra.git
   cd gudang-mitra
   ```

2. **Copy Application Files**:
   - Copy all files from your current project directory
   - Ensure all folders are included (src/, server/, public/)

3. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Initial commit: Professional 3D Inventory Management System"
   git push origin main
   ```

### For Railway Backend Deployment

1. **Go to Railway Dashboard**: [railway.app](https://railway.app)
2. **Create New Project** from GitHub repository
3. **Set Root Directory**: `server`
4. **Add Environment Variables**:
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
   OPENAI_API_KEY=your-openai-api-key-here
   ```

5. **Setup AI Chat**: Follow [OPENAI_SETUP.md](OPENAI_SETUP.md) to configure the AI chat feature

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
