const db = require('../config/database');

// 创建订单
exports.createOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const { products, address } = req.body;

    // 生成订单号
    const orderNo = `ORDER${Date.now()}${Math.random().toString(36).substr(2, 6)}`;

    // 计算订单总金额
    let totalAmount = 0;
    for (const item of products) {
      const [product] = await conn.query('SELECT * FROM products WHERE id = ?', [item.productId]);
      if (!product) {
        throw new Error(`商品不存在: ${item.productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`商品库存不足: ${product.name}`);
      }
      totalAmount += product.price * item.quantity;
    }

    // 创建订单
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_no, user_id, total_amount, shipping_fee, paid_amount, 
        status, address, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [orderNo, userId, totalAmount, 0, totalAmount, 'pending', JSON.stringify(address)]
    );

    // 创建订单商品
    for (const item of products) {
      const [product] = await conn.query('SELECT * FROM products WHERE id = ?', [item.productId]);
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, 
          quantity, total_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderResult.insertId, item.productId, product.name, product.price, 
         item.quantity, product.price * item.quantity]
      );

      // 更新商品库存
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    await conn.commit();

    res.json({
      code: 0,
      data: {
        orderId: orderResult.insertId,
        orderNo
      }
    });
  } catch (error) {
    await conn.rollback();
    console.error('创建订单失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '创建订单失败'
    });
  } finally {
    conn.release();
  }
};

// 获取订单列表
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, pageSize = 10 } = req.query;
    
    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    // 获取总数
    const [countResult] = await db.query(
      sql.replace('*', 'COUNT(*) as total'),
      params
    );
    const total = countResult.total;

    // 分页
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (page - 1) * pageSize);

    const orders = await db.query(sql, params);

    // 获取订单商品
    for (const order of orders) {
      const items = await db.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.products = items;
    }

    res.json({
      code: 0,
      data: {
        list: orders,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取订单列表失败'
    });
  }
};

// 获取订单详情
exports.getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    // 获取订单商品
    const products = await db.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );
    order.products = products;

    res.json({
      code: 0,
      data: order
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取订单详情失败'
    });
  }
};

// 取消订单
exports.cancelOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [id, userId, 'pending']
    );

    if (!order) {
      throw new Error('订单不存在或无法取消');
    }

    // 恢复商品库存
    const orderItems = await conn.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    for (const item of orderItems) {
      await conn.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 更新订单状态
    await conn.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    await conn.commit();

    res.json({
      code: 0,
      message: '取消成功'
    });
  } catch (error) {
    await conn.rollback();
    console.error('取消订单失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '取消订单失败'
    });
  } finally {
    conn.release();
  }
};

// 确认收货
exports.confirmOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [id, userId, 'shipped']
    );

    if (!order) {
      return res.status(400).json({
        code: 400,
        message: '订单不存在或无法确认收货'
      });
    }

    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      ['completed', id]
    );

    res.json({
      code: 0,
      message: '确认成功'
    });
  } catch (error) {
    console.error('确认收货失败:', error);
    res.status(500).json({
      code: 500,
      message: '确认收货失败'
    });
  }
};

// 删除订单
exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [id, userId, 'completed']
    );

    if (!order) {
      return res.status(400).json({
        code: 400,
        message: '订单不存在或无法删除'
      });
    }

    await db.query('DELETE FROM orders WHERE id = ?', [id]);

    res.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除订单失败'
    });
  }
};

// 获取订单支付参数
exports.getOrderPayParams = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ?',
      [id, userId, 'pending']
    );

    if (!order) {
      return res.status(400).json({
        code: 400,
        message: '订单不存在或无法支付'
      });
    }

    // TODO: 调用支付接口获取支付参数
    const payParams = {
      timeStamp: Date.now().toString(),
      nonceStr: Math.random().toString(36).substr(2, 16),
      package: `prepay_id=wx${Date.now()}`,
      signType: 'MD5',
      paySign: 'mock_sign'
    };

    res.json({
      code: 0,
      data: payParams
    });
  } catch (error) {
    console.error('获取支付参数失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取支付参数失败'
    });
  }
};

// 获取订单物流信息
exports.getOrderLogistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [order] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status IN (?, ?)',
      [id, userId, 'shipped', 'completed']
    );

    if (!order) {
      return res.status(400).json({
        code: 400,
        message: '订单不存在或无法查看物流'
      });
    }

    // TODO: 调用物流接口获取物流信息
    const logistics = {
      status: '运输中',
      description: '商品正在配送中',
      company: '顺丰速运',
      trackingNo: 'SF1234567890',
      shippingTime: '2024-01-20 10:00:00',
      estimatedDelivery: '2024-01-22 18:00:00',
      tracks: [
        {
          time: '2024-01-20 10:00:00',
          status: '已发货',
          location: '广州市天河区'
        },
        {
          time: '2024-01-21 15:30:00',
          status: '运输中',
          location: '深圳市南山区'
        }
      ]
    };

    res.json({
      code: 0,
      data: logistics
    });
  } catch (error) {
    console.error('获取物流信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取物流信息失败'
    });
  }
}; 