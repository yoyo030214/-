const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Policy = require('./Policy');
const PolicyFavorite = require('./PolicyFavorite');
const Image = require('./Image');
const Merchant = require('./Merchant');
const Customer = require('./Customer');
const MerchantProduct = require('./MerchantProduct');
const MerchantOrder = require('./MerchantOrder');
const MerchantOrderItem = require('./MerchantOrderItem');

// 定义模型之间的关联关系
User.hasMany(Product, { foreignKey: 'farmer_id', as: 'products' });
Product.belongsTo(User, { foreignKey: 'farmer_id', as: 'farmer' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// 政策收藏关联
User.hasMany(PolicyFavorite, { foreignKey: 'user_id', as: 'policyFavorites' });
PolicyFavorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Policy.hasMany(PolicyFavorite, { foreignKey: 'policy_id', as: 'favorites' });
PolicyFavorite.belongsTo(Policy, { foreignKey: 'policy_id', as: 'policy' });

// 图片关联
User.hasMany(Image, { foreignKey: 'uploaded_by', as: 'uploadedImages' });
Image.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

Product.hasMany(Image, { 
  foreignKey: 'related_id', 
  scope: { category: 'product' }, 
  as: 'productImages'
});

Policy.hasMany(Image, { 
  foreignKey: 'related_id', 
  scope: { category: 'policy' }, 
  as: 'policyImages'
});

// 同步数据库模型
const syncDatabase = async () => {
  try {
    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 同步所有模型到数据库
    // force: true 将会先删除表再创建（谨慎在生产环境使用）
    await sequelize.sync({ force: true });
    console.log('数据库模型同步成功');
    
    // 启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('数据库模型同步失败:', error);
    throw error;
  }
};

// 同步商家数据库模型
const syncMerchantDatabase = async () => {
  try {
    // 禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 同步所有商家模型到数据库
    await sequelize.sync({ force: true });
    console.log('商家数据库模型同步成功');
    
    // 启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('商家数据库模型同步失败:', error);
    throw error;
  }
};

module.exports = {
  User,
  Product,
  Order,
  OrderItem,
  Policy,
  PolicyFavorite,
  Image,
  sequelize,
  syncDatabase,
  Merchant,
  Customer,
  MerchantProduct,
  MerchantOrder,
  MerchantOrderItem,
  syncMerchantDatabase
}; 