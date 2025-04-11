-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建商品分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建商品表
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    stock INT NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT '个',
    images JSON,
    specifications JSON,
    tags JSON,
    sales INT DEFAULT 0,
    views INT DEFAULT 0,
    status ENUM('on_sale', 'off_sale') DEFAULT 'on_sale',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建购物车表
CREATE TABLE IF NOT EXISTS cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
    address TEXT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建订单商品表
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入测试数据
INSERT INTO users (username, password, nickname) VALUES 
('admin', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iq.8V9q0qX5Wm', '管理员');

INSERT INTO categories (name, sort_order) VALUES 
('水果', 1),
('蔬菜', 2),
('粮油', 3),
('零食', 4);

-- 插入测试商品数据
INSERT INTO products (category_id, name, description, price, original_price, stock, unit, images, specifications, tags, sales, views) VALUES 
(1, '红富士苹果', '新鲜采摘的红富士苹果,果肉细腻,口感香甜', 5.99, 8.99, 100, '斤', 
JSON_ARRAY('https://img.example.com/apple1.jpg', 'https://img.example.com/apple2.jpg'),
JSON_OBJECT('规格', '500g/份', '产地', '陕西', '保质期', '7天'),
JSON_ARRAY('新鲜', '特价', '热销'),
50, 200),

(1, '香蕉', '进口香蕉,果肉软糯,营养丰富', 3.99, 5.99, 200, '斤',
JSON_ARRAY('https://img.example.com/banana1.jpg', 'https://img.example.com/banana2.jpg'),
JSON_OBJECT('规格', '500g/份', '产地', '菲律宾', '保质期', '5天'),
JSON_ARRAY('进口', '特价'),
30, 150),

(2, '有机生菜', '无农药有机生菜,新鲜采摘', 4.99, 6.99, 50, '份',
JSON_ARRAY('https://img.example.com/lettuce1.jpg', 'https://img.example.com/lettuce2.jpg'),
JSON_OBJECT('规格', '300g/份', '产地', '本地', '保质期', '3天'),
JSON_ARRAY('有机', '新鲜'),
20, 100),

(2, '西红柿', '温室种植西红柿,酸甜可口', 3.99, 5.99, 80, '斤',
JSON_ARRAY('https://img.example.com/tomato1.jpg', 'https://img.example.com/tomato2.jpg'),
JSON_OBJECT('规格', '500g/份', '产地', '本地', '保质期', '5天'),
JSON_ARRAY('新鲜', '特价'),
40, 180),

(3, '五常大米', '东北五常大米,颗粒饱满', 39.99, 49.99, 30, '袋',
JSON_ARRAY('https://img.example.com/rice1.jpg', 'https://img.example.com/rice2.jpg'),
JSON_OBJECT('规格', '5kg/袋', '产地', '黑龙江', '保质期', '12个月'),
JSON_ARRAY('优质', '热销'),
15, 120),

(3, '花生油', '压榨花生油,纯正香浓', 59.99, 69.99, 40, '瓶',
JSON_ARRAY('https://img.example.com/oil1.jpg', 'https://img.example.com/oil2.jpg'),
JSON_OBJECT('规格', '5L/瓶', '产地', '山东', '保质期', '18个月'),
JSON_ARRAY('优质', '特价'),
25, 160),

(4, '薯片', '进口薯片,香脆可口', 9.99, 12.99, 100, '包',
JSON_ARRAY('https://img.example.com/chips1.jpg', 'https://img.example.com/chips2.jpg'),
JSON_OBJECT('规格', '100g/包', '产地', '美国', '保质期', '6个月'),
JSON_ARRAY('进口', '零食'),
60, 300),

(4, '坚果礼盒', '混合坚果,营养美味', 29.99, 39.99, 50, '盒',
JSON_ARRAY('https://img.example.com/nuts1.jpg', 'https://img.example.com/nuts2.jpg'),
JSON_OBJECT('规格', '500g/盒', '产地', '混合', '保质期', '6个月'),
JSON_ARRAY('礼盒', '零食'),
35, 200); 