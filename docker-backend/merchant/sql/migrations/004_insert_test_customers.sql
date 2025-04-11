-- 插入测试客户数据
INSERT INTO customers (name, phone, email, level, address, status) VALUES
('张三', '13800138001', 'zhangsan@example.com', 'normal', '北京市朝阳区xxx街道', 'active'),
('李四', '13800138002', 'lisi@example.com', 'vip', '上海市浦东新区xxx路', 'active'),
('王五', '13800138003', 'wangwu@example.com', 'premium', '广州市天河区xxx大厦', 'active'),
('赵六', '13800138004', 'zhaoliu@example.com', 'normal', '深圳市南山区xxx小区', 'inactive'),
('钱七', '13800138005', 'qianqi@example.com', 'vip', '成都市武侯区xxx街', 'active'),
('孙八', '13800138006', 'sunba@example.com', 'normal', '杭州市西湖区xxx路', 'active'),
('周九', '13800138007', 'zhoujiu@example.com', 'premium', '南京市玄武区xxx广场', 'active'),
('吴十', '13800138008', 'wushi@example.com', 'vip', '武汉市洪山区xxx花园', 'inactive');

-- 插入测试订单统计数据
INSERT INTO customer_order_stats (customer_id, order_count, total_spent, last_order_time) VALUES
(1, 5, 1500.00, NOW()),
(2, 8, 2500.00, NOW()),
(3, 12, 5000.00, NOW()),
(4, 3, 800.00, NOW()),
(5, 6, 1800.00, NOW()),
(6, 4, 1200.00, NOW()),
(7, 10, 3500.00, NOW()),
(8, 7, 2200.00, NOW());

-- 插入测试客户偏好数据
INSERT INTO customer_preferences (customer_id, category_id, order_count, total_spent, last_purchase_time) VALUES
(1, 1, 2, 600.00, NOW()),
(1, 2, 3, 900.00, NOW()),
(2, 1, 4, 1200.00, NOW()),
(2, 3, 4, 1300.00, NOW()),
(3, 2, 5, 2000.00, NOW()),
(3, 3, 7, 3000.00, NOW()),
(4, 1, 1, 300.00, NOW()),
(4, 2, 2, 500.00, NOW()),
(5, 2, 3, 900.00, NOW()),
(5, 3, 3, 900.00, NOW()),
(6, 1, 2, 600.00, NOW()),
(6, 2, 2, 600.00, NOW()),
(7, 1, 4, 1400.00, NOW()),
(7, 3, 6, 2100.00, NOW()),
(8, 2, 3, 900.00, NOW()),
(8, 3, 4, 1300.00, NOW());

-- 插入测试访问记录
INSERT INTO customer_visits (customer_id, visit_time, ip_address, user_agent) VALUES
(1, NOW(), '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(2, NOW(), '192.168.1.2', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'),
(3, NOW(), '192.168.1.3', 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)'),
(4, NOW(), '192.168.1.4', 'Mozilla/5.0 (Android 10; Mobile; rv:91.0)'),
(5, NOW(), '192.168.1.5', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0'),
(6, NOW(), '192.168.1.6', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
(7, NOW(), '192.168.1.7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/91.0'),
(8, NOW(), '192.168.1.8', 'Mozilla/5.0 (X11; Linux x86_64) Firefox/91.0'); 