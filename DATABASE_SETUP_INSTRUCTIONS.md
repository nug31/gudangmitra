# Database Setup Instructions for Loan Management System

## 🗄️ Required Database Changes

To enable the loan management system for electronics, you need to run the following SQL commands on your Railway database:

### 1. Create the Loans Table

```sql
-- Create loans table for borrowing/returning electronic items
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  status ENUM('active', 'returned', 'overdue') NOT NULL DEFAULT 'active',
  borrowed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NOT NULL,
  returned_date TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### 2. Add Indexes for Performance

```sql
-- Add indexes for better performance
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_item_id ON loans(item_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
```

### 3. Add Borrowed Quantity Column to Items Table

```sql
-- Add borrowed_quantity column to items table to track how many are currently borrowed
ALTER TABLE items ADD COLUMN borrowed_quantity INT DEFAULT 0 AFTER quantity;
```

### 4. Update Existing Items (Optional)

```sql
-- Set borrowed_quantity to 0 for all existing items
UPDATE items SET borrowed_quantity = 0 WHERE borrowed_quantity IS NULL;
```

## 🚀 How to Run These Commands

### Option 1: Railway Dashboard
1. Go to your Railway project dashboard
2. Click on your MySQL database
3. Go to the "Query" tab
4. Copy and paste each SQL command above
5. Execute them one by one

### Option 2: MySQL Client
1. Connect to your Railway database using the connection details
2. Run the SQL commands in your MySQL client

### Option 3: phpMyAdmin (if available)
1. Access phpMyAdmin through Railway
2. Select your database
3. Go to SQL tab
4. Run the commands

## ✅ Verification

After running the commands, verify the setup:

```sql
-- Check if loans table was created
DESCRIBE loans;

-- Check if borrowed_quantity column was added
DESCRIBE items;

-- Check indexes
SHOW INDEX FROM loans;
```

## 📋 What This Enables

Once the database is updated, users will be able to:

✅ **Borrow Electronics**: Only items in the "electronics" category can be borrowed
✅ **Set Due Dates**: Maximum loan period is 30 days
✅ **Track Availability**: Real-time tracking of available vs borrowed quantities
✅ **Return Items**: Simple return process with optional notes
✅ **View Loan History**: Users see their loans, admins see all loans
✅ **Overdue Management**: Automatic detection and marking of overdue loans
✅ **Availability Checking**: Prevents overbooking of items

## 🔧 Features Available After Setup

- **Browse Items Page**: Electronics will show a "Borrow" button
- **Loans Page**: New page accessible via navigation menu
- **Loan Management**: Full CRUD operations for loans
- **Admin Dashboard**: Admins can see all loans and overdue items
- **User Dashboard**: Users can track their borrowed items

## 🎯 Next Steps

1. Run the SQL commands above
2. Deploy the updated application (already done via git push)
3. Test the loan functionality:
   - Add some electronics items to inventory
   - Try borrowing an electronic item
   - Check the loans page
   - Test returning items

The loan management system is now ready to use! 🎉
