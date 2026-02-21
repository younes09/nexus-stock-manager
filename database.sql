-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS nexus_stock_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nexus_stock_manager;

-- Drop tables if they exist to allow clean imports
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS entities;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS cash_transactions;
DROP TABLE IF EXISTS users;

-- 1. Users Table (for Authentication)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, -- UUID
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'authorized',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user
-- The password is 'admin123' (bcrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role) 
VALUES (UUID(), 'admin@admin.com', '$2y$10$iA2lwDR7tnPvbKW6wgHDg.PNmB2oVPjIIhn3iDMXzDrC3GaPHzwDC', 'Admin User', 'admin');

-- 2. Categories Table
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name) VALUES
(UUID(), 'Electronics'),
(UUID(), 'Groceries'),
(UUID(), 'Clothing'),
(UUID(), 'Home & Garden'),
(UUID(), 'Automotive');



-- 3. Products Table
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    expiry_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO products (id, name, sku, category, price, cost, stock, min_stock, expiry_date) VALUES
(UUID(), 'Smartphone X1', 'ELEC-001', 'Electronics', 699.99, 450.00, 50, 10, NULL),
(UUID(), 'Wireless Headphones', 'ELEC-002', 'Electronics', 149.99, 80.00, 120, 20, NULL),
(UUID(), 'Organic Milk 1L', 'GROC-001', 'Groceries', 2.50, 1.20, 200, 50, '2024-12-31'),
(UUID(), 'Cotton T-Shirt', 'CLTH-001', 'Clothing', 25.00, 12.00, 300, 50, NULL),
(UUID(), 'Garden Hose 50ft', 'HOME-001', 'Home & Garden', 35.00, 18.00, 80, 15, NULL),
(UUID(), 'Car Wax Kit', 'AUTO-001', 'Automotive', 45.00, 25.00, 60, 10, NULL);


-- 4. Entities Table (Clients & Suppliers)
CREATE TABLE entities (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('client', 'supplier') NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Invoices Table
CREATE TABLE invoices (
    id CHAR(36) PRIMARY KEY,
    number VARCHAR(100) NOT NULL UNIQUE,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    type ENUM('sale', 'purchase') NOT NULL,
    entity_id CHAR(36) NULL,
    entity_name VARCHAR(255) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'paid',
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL
);

-- 6. Invoice Items Table
CREATE TABLE invoice_items (
    id CHAR(36) PRIMARY KEY,
    invoice_id CHAR(36) NOT NULL,
    product_id CHAR(36) NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 7. Cash Transactions Table
CREATE TABLE cash_transactions (
    id CHAR(36) PRIMARY KEY,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(255) NOT NULL
);
