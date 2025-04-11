-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '客户姓名',
    phone VARCHAR(20) NOT NULL COMMENT '手机号码',
    email VARCHAR(100) COMMENT '电子邮箱',
    level ENUM('normal', 'vip', 'premium') DEFAULT 'normal' COMMENT '会员等级',
    address TEXT COMMENT '收货地址',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '客户状态',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- 创建客户订单统计表
CREATE TABLE IF NOT EXISTS customer_order_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL COMMENT '客户ID',
    order_count INT DEFAULT 0 COMMENT '订单总数',
    total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT '消费总额',
    last_order_time DATETIME COMMENT '最近下单时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_customer_id (customer_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户订单统计表';

-- 创建客户偏好分析表
CREATE TABLE IF NOT EXISTS customer_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL COMMENT '客户ID',
    category_id INT NOT NULL COMMENT '产品类别ID',
    order_count INT DEFAULT 0 COMMENT '购买次数',
    total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT '购买金额',
    last_purchase_time DATETIME COMMENT '最近购买时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_customer_category (customer_id, category_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户偏好分析表';

-- 创建客户访问记录表
CREATE TABLE IF NOT EXISTS customer_visits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL COMMENT '客户ID',
    visit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户访问记录表';

-- 创建触发器：更新客户订单统计
DELIMITER //
CREATE TRIGGER after_order_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
    INSERT INTO customer_order_stats (customer_id)
    VALUES (NEW.customer_id)
    ON DUPLICATE KEY UPDATE
        order_count = order_count + 1,
        total_spent = total_spent + NEW.total_amount,
        last_order_time = NEW.create_time;
END//

-- 创建触发器：更新客户偏好分析
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE category_id INT;
    
    -- 获取产品类别ID
    SELECT category_id INTO category_id
    FROM products
    WHERE id = NEW.product_id;
    
    -- 更新客户偏好分析
    INSERT INTO customer_preferences (customer_id, category_id)
    SELECT o.customer_id, category_id
    FROM orders o
    WHERE o.id = NEW.order_id
    ON DUPLICATE KEY UPDATE
        order_count = order_count + 1,
        total_spent = total_spent + NEW.price * NEW.quantity,
        last_purchase_time = NOW();
END//
DELIMITER ; 