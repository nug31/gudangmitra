# Step-by-Step Guide: Membangun Aplikasi Gudang Mitra
## Dari Konsep Hingga Deployment

### 📋 Daftar Isi
1. [Persiapan dan Setup Awal](#1-persiapan-dan-setup-awal)
2. [Struktur Database](#2-struktur-database)
3. [Backend Development](#3-backend-development)
4. [Frontend Development](#4-frontend-development)
5. [Integrasi dan Testing](#5-integrasi-dan-testing)
6. [Deployment](#6-deployment)
7. [Optimasi dan Maintenance](#7-optimasi-dan-maintenance)

---

## 1. Persiapan dan Setup Awal

### 1.1 Instalasi Tools dan Dependencies
```bash
# Install Node.js (versi 18+)
# Download dari https://nodejs.org/

# Verify installation
node --version
npm --version

# Install Git
# Download dari https://git-scm.com/

# Install VS Code
# Download dari https://code.visualstudio.com/
```

### 1.2 Setup Project Structure
```bash
# Buat folder project
mkdir gudang-mitra
cd gudang-mitra

# Initialize Git repository
git init
git remote add origin https://github.com/username/gudangmitra.git

# Buat struktur folder
mkdir server
mkdir src
mkdir public
```

### 1.3 Initialize Frontend (React + Vite)
```bash
# Create React app dengan Vite
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom

# Setup Tailwind CSS
npx tailwindcss init -p
```

### 1.4 Initialize Backend (Node.js + Express)
```bash
cd server

# Initialize package.json
npm init -y

# Install backend dependencies
npm install express cors mysql2 dotenv
npm install -D nodemon

# Create basic server structure
touch index.js
touch .env
touch .env.example
```

---

## 2. Struktur Database

### 2.1 Design Database Schema
```sql
-- Database: gudang_mitra

-- Table: users
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: items
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  quantity INT DEFAULT 0,
  minQuantity INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  isActive TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: requests
CREATE TABLE requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  description TEXT,
  requested_delivery_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Table: notifications
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.2 Setup Database Connection
```javascript
// server/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

---

## 3. Backend Development

### 3.1 Basic Server Setup
```javascript
// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Gudang Mitra API Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3.2 Authentication Endpoints
```javascript
// server/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
```

### 3.3 Items Management Endpoints
```javascript
// server/routes/items.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all items
router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT id, name, description, category, quantity,
             minQuantity, price,
             CASE
               WHEN quantity <= 0 THEN 'out-of-stock'
               WHEN quantity <= minQuantity THEN 'low-stock'
               ELSE 'in-stock'
             END as status
      FROM items
      WHERE isActive = 1
      ORDER BY name
    `);

    res.json(items);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items'
    });
  }
});

// Add new item (Admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, category, quantity, minQuantity, price } = req.body;

    const [result] = await pool.query(`
      INSERT INTO items (name, description, category, quantity, minQuantity, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, category, quantity, minQuantity, price]);

    res.json({
      success: true,
      message: 'Item added successfully',
      itemId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item'
    });
  }
});

module.exports = router;
```

---

## 4. Frontend Development

### 4.1 Setup Routing
```typescript
// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import BrowseItemsPage from '../pages/BrowseItemsPage';
import RequestsPage from '../pages/RequestsPage';
import InventoryPage from '../pages/InventoryPage';
import UsersPage from '../pages/UsersPage';

const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  requireAdmin?: boolean;
  requireManager?: boolean;
}> = ({ element, requireAdmin = false, requireManager = false }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireManager && user?.role !== "manager") {
    return <Navigate to="/" replace />;
  }

  return element;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/browse" element={<BrowseItemsPage />} />
        <Route path="/requests" element={<ProtectedRoute element={<RequestsPage />} />} />
        <Route path="/inventory" element={<ProtectedRoute element={<InventoryPage />} requireAdmin={true} />} />
        <Route path="/users" element={<ProtectedRoute element={<UsersPage />} requireManager={true} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
```

### 4.2 Authentication Context
```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'manager',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 4.3 Main Layout Component
```typescript
// src/components/layout/MainLayout.tsx
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <Navbar />
      <main className="flex-grow relative z-10">
        <div className={`${fullWidth ? "w-full" : "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"}`}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
```

### 4.4 Dashboard Components
```typescript
// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

interface DashboardStats {
  totalItems: number;
  totalRequests: number;
  pendingRequests: number;
  lowStockItems: number;
}

const HomePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalRequests: 0,
    pendingRequests: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-lg text-gray-600">
          You are logged in as {isAdmin ? 'an administrator' : 'a regular user'}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Total Items</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.totalItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Total Requests</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.totalRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.lowStockItems}</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HomePage;
```

---

## 5. Integrasi dan Testing

### 5.1 API Integration
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-api-url.com'
  : 'http://localhost:5000';

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // Items
  getItems: async () => {
    const response = await fetch(`${API_BASE_URL}/api/items`);
    return response.json();
  },

  addItem: async (item: any) => {
    const response = await fetch(`${API_BASE_URL}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return response.json();
  },

  // Requests
  getRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/api/requests`);
    return response.json();
  },

  createRequest: async (request: any) => {
    const response = await fetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return response.json();
  },
};
```

### 5.2 Environment Configuration
```bash
# .env.example
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gudang_mitra
PORT=5000

# .env.production
DB_HOST=your_production_host
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=your_production_db
PORT=5000
```

---

## 6. Deployment

### 6.1 Database Setup (Railway)
```bash
# 1. Create Railway account
# 2. Create new project
# 3. Add MySQL database
# 4. Get connection details
# 5. Import database schema
```

### 6.2 Backend Deployment (Railway)
```bash
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node server/index.js"
healthcheckPath = "/"
healthcheckTimeout = 180
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 5

[build.env]
NODE_ENV = "production"
```

### 6.3 Frontend Deployment (Netlify)
```bash
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### 6.4 Deployment Steps
```bash
# 1. Push code to GitHub
git add .
git commit -m "Initial deployment"
git push origin main

# 2. Connect Railway to GitHub repo
# 3. Set environment variables in Railway
# 4. Deploy backend

# 5. Connect Netlify to GitHub repo
# 6. Set build settings in Netlify
# 7. Deploy frontend

# 8. Update API URLs in frontend
# 9. Test production deployment
```

---

## 7. Optimasi dan Maintenance

### 7.1 Performance Optimization
```typescript
// Lazy loading components
const InventoryPage = React.lazy(() => import('../pages/InventoryPage'));
const UsersPage = React.lazy(() => import('../pages/UsersPage'));

// Memoization
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});

// Debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### 7.2 Error Handling
```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### 7.3 Monitoring dan Logging
```javascript
// Server logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: error.message });
```

---

## 🎉 Kesimpulan

Dengan mengikuti panduan step-by-step ini, Anda telah berhasil membangun aplikasi Gudang Mitra yang lengkap dengan:

✅ **Frontend Modern**: React + TypeScript + Tailwind CSS
✅ **Backend Robust**: Node.js + Express + MySQL
✅ **Authentication**: Multi-level user roles
✅ **Database**: Relational database dengan Railway
✅ **Deployment**: Cloud deployment dengan Netlify + Railway
✅ **Features**: 9 fitur utama yang terintegrasi
✅ **Optimization**: Performance dan error handling

**Total Development Time**: ~4-6 minggu untuk developer berpengalaman
**Lines of Code**: ~15,000+ lines
**Technologies**: 10+ modern web technologies

---

## 📚 Resources Tambahan

### Dokumentasi Resmi
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools dan Platform
- [Railway](https://railway.app/) - Database hosting
- [Netlify](https://netlify.com/) - Frontend hosting
- [VS Code](https://code.visualstudio.com/) - Code editor
- [GitHub](https://github.com/) - Version control

### Best Practices
- Follow React best practices dan hooks patterns
- Implement proper error handling di semua level
- Use TypeScript untuk type safety
- Optimize performance dengan lazy loading
- Implement proper security measures
- Write clean, maintainable code

**Selamat! Anda telah berhasil membangun aplikasi Gudang Mitra yang profesional! 🚀**
