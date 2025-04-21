-- 创建数据库
CREATE DATABASE IF NOT EXISTS agriculture_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agriculture_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'merchant', 'admin') DEFAULT 'user',
  phone VARCHAR(20),
  email VARCHAR(100),
  avatar VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 政策表
CREATE TABLE IF NOT EXISTS policies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('planting', 'machinery', 'animal', 'industry', 'land', 'green', 'insurance', 'finance') NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  publish_date DATE,
  effective_date DATE,
  expiry_date DATE,
  version VARCHAR(20),
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 农户故事表
CREATE TABLE IF NOT EXISTS farmer_stories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  farmer_id INT,
  farmer_name VARCHAR(100),
  location VARCHAR(255),
  type ENUM('story', 'experience', 'news') DEFAULT 'story',
  related_product_id INT,
  view_count INT DEFAULT 0,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 农产品表
CREATE TABLE IF NOT EXISTS farmer_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sub_category VARCHAR(50),
  origin VARCHAR(255),
  shelf_life VARCHAR(50),
  storage_method VARCHAR(255),
  farmer_id INT,
  farmer_name VARCHAR(100),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_farmer_stories_type ON farmer_stories(type);
CREATE INDEX idx_farmer_stories_status ON farmer_stories(status);
CREATE INDEX idx_farmer_products_category ON farmer_products(category);
CREATE INDEX idx_farmer_products_status ON farmer_products(status); 