-- 优化商品表
ALTER TABLE products 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE COMMENT '是否特色商品',
ADD COLUMN location_lat DECIMAL(10,6) COMMENT '纬度',
ADD COLUMN location_lng DECIMAL(10,6) COMMENT '经度',
ADD COLUMN location_name VARCHAR(100) COMMENT '位置名称',
ADD COLUMN season_start INT COMMENT '季节开始月份',
ADD COLUMN season_end INT COMMENT '季节结束月份',
ADD COLUMN sales_count INT DEFAULT 0 COMMENT '销量',
ADD COLUMN view_count INT DEFAULT 0 COMMENT '浏览量';

-- 创建商品图片表
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品图片表';

-- 创建商品收藏表
CREATE TABLE IF NOT EXISTS product_favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT NOT NULL COMMENT '商品ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY `uk_user_product` (`user_id`, `product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品收藏表';

-- 创建商品浏览记录表
CREATE TABLE IF NOT EXISTS product_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    product_id INT NOT NULL COMMENT '商品ID',
    view_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品浏览记录表';

-- 创建商品销售记录表
CREATE TABLE IF NOT EXISTS product_sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL COMMENT '商品ID',
    order_id INT NOT NULL COMMENT '订单ID',
    quantity INT NOT NULL COMMENT '销售数量',
    price DECIMAL(10,2) NOT NULL COMMENT '销售价格',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品销售记录表';

-- 添加索引
ALTER TABLE products ADD INDEX idx_category_season (category_id, season_start, season_end);
ALTER TABLE products ADD INDEX idx_featured (is_featured);
ALTER TABLE products ADD INDEX idx_location (location_lat, location_lng);
ALTER TABLE product_images ADD INDEX idx_product_sort (product_id, sort_order);
ALTER TABLE product_favorites ADD INDEX idx_user (user_id);
ALTER TABLE product_views ADD INDEX idx_product_time (product_id, view_time);
ALTER TABLE product_sales ADD INDEX idx_product_time (product_id, create_time); 