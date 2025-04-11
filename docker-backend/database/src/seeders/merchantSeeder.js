const bcrypt = require('bcryptjs');
const { Merchant, Customer, MerchantProduct, MerchantOrder, MerchantOrderItem } = require('../models');

const initializeMerchantSeeds = async () => {
  try {
    // 创建示例商家
    const hashedPassword = await bcrypt.hash('123456', 10);
    const merchant = await Merchant.create({
      username: 'demo_merchant',
      password: hashedPassword,
      storeName: '示例商家店铺',
      contactName: '张三',
      contactPhone: '13800138000',
      email: 'demo@example.com',
      address: '北京市朝阳区xxx街道',
      memberLevel: '专业版',
      status: '正常',
      balance: 10000.00,
      description: '这是一个示例商家店铺，用于演示系统功能。'
    });

    // 创建示例客户
    const customers = await Promise.all([
      Customer.create({
        merchantId: merchant.id,
        name: '李四',
        phone: '13900139000',
        email: 'lisi@example.com',
        address: '北京市海淀区xxx街道',
        memberLevel: 'VIP会员',
        totalOrders: 5,
        totalSpent: 1500.00,
        lastOrderDate: new Date(),
        status: '活跃'
      }),
      Customer.create({
        merchantId: merchant.id,
        name: '王五',
        phone: '13700137000',
        email: 'wangwu@example.com',
        address: '北京市西城区xxx街道',
        memberLevel: '普通会员',
        totalOrders: 2,
        totalSpent: 500.00,
        lastOrderDate: new Date(),
        status: '活跃'
      })
    ]);

    // 创建示例商品
    const products = await Promise.all([
      MerchantProduct.create({
        merchantId: merchant.id,
        name: '有机蔬菜礼盒',
        description: '精选有机蔬菜，营养美味',
        category: '蔬菜',
        price: 99.00,
        stock: 100,
        unit: '盒',
        images: 'vegetable-box.jpg',
        isOnSale: true,
        salesCount: 50,
        isRecommended: true
      }),
      MerchantProduct.create({
        merchantId: merchant.id,
        name: '新鲜水果礼盒',
        description: '应季水果，新鲜采摘',
        category: '水果',
        price: 129.00,
        stock: 80,
        unit: '盒',
        images: 'fruit-box.jpg',
        isOnSale: true,
        salesCount: 30,
        isRecommended: true
      })
    ]);

    // 创建示例订单
    const order = await MerchantOrder.create({
      orderNumber: 'MO' + Date.now(),
      merchantId: merchant.id,
      customerId: customers[0].id,
      totalAmount: 228.00,
      status: '已完成',
      paymentStatus: '已支付',
      paymentMethod: '微信支付',
      shippingAddress: customers[0].address,
      shippingFee: 10.00,
      shippingMethod: '快递',
      trackingNumber: 'SF' + Date.now(),
      orderDate: new Date(),
      processingDate: new Date(),
      shippingDate: new Date(),
      completionDate: new Date()
    });

    // 创建订单项
    await Promise.all([
      MerchantOrderItem.create({
        orderId: order.id,
        productId: products[0].id,
        productName: products[0].name,
        quantity: 1,
        unitPrice: products[0].price,
        totalPrice: products[0].price,
        discount: 0
      }),
      MerchantOrderItem.create({
        orderId: order.id,
        productId: products[1].id,
        productName: products[1].name,
        quantity: 1,
        unitPrice: products[1].price,
        totalPrice: products[1].price,
        discount: 0
      })
    ]);

    console.log('商家模块种子数据初始化成功');
  } catch (error) {
    console.error('商家模块种子数据初始化失败:', error);
    throw error;
  }
};

module.exports = {
  initializeMerchantSeeds
}; 