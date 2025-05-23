-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('electronics', 'office-supplies', 'furniture', 'software', 'other') NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  minQuantity INT NOT NULL DEFAULT 0,
  status ENUM('in-stock', 'low-stock', 'out-of-stock') NOT NULL,
  lastRestocked DATETIME
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  itemId INT NOT NULL,
  itemName VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  priority ENUM('high', 'medium', 'low') NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL,
  description TEXT,
  requestedDeliveryDate DATE,
  attachment VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (itemId) REFERENCES items(id)
);

-- Insert sample data for items
INSERT INTO items (name, description, category, quantity, minQuantity, status) VALUES
('Dell XPS 13 Laptop', 'High-performance laptop with 16GB RAM and 512GB SSD', 'electronics', 5, 2, 'in-stock'),
('Ergonomic Office Chair', 'Adjustable office chair with lumbar support', 'furniture', 10, 3, 'in-stock'),
('Wireless Mouse', 'Bluetooth wireless mouse', 'electronics', 15, 5, 'in-stock'),
('Whiteboard', 'Large whiteboard for meeting rooms', 'office-supplies', 2, 1, 'in-stock'),
('Microsoft Office 365', 'Office productivity suite', 'software', 20, 5, 'in-stock'),
('Monitor Stand', 'Adjustable monitor stand', 'office-supplies', 8, 3, 'in-stock'),
('Desk Lamp', 'LED desk lamp with adjustable brightness', 'office-supplies', 12, 4, 'in-stock'),
('Wireless Keyboard', 'Bluetooth wireless keyboard', 'electronics', 0, 3, 'out-of-stock');

-- Insert sample data for users
INSERT INTO users (username, email, password, role) VALUES
('Admin User', 'admin@example.com', 'admin123', 'admin'),
('Regular User', 'user@example.com', 'user123', 'user');

-- Insert sample data for requests
INSERT INTO requests (userId, itemId, itemName, quantity, priority, status, description, requestedDeliveryDate) VALUES
(2, 1, 'Dell XPS 13 Laptop', 1, 'high', 'pending', 'Need a new laptop for development work', '2025-07-15'),
(2, 2, 'Ergonomic Office Chair', 2, 'medium', 'approved', 'Dual monitors for better productivity', '2025-06-20');
