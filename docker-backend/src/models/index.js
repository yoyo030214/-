const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Policy = require('./Policy');
const PolicyFavorite = require('./PolicyFavorite');
const Image = require('./Image');
const sequelize = require('../config/database');

// 定义模型之间的关联关系
User.hasMany(Product, { foreignKey: 'farmerId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'farmerId', as: 'farmer' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// 政策收藏关联
User.hasMany(PolicyFavorite, { foreignKey: 'userId', as: 'policyFavorites' });
PolicyFavorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Policy.hasMany(PolicyFavorite, { foreignKey: 'policyId', as: 'favorites' });
PolicyFavorite.belongsTo(Policy, { foreignKey: 'policyId', as: 'policy' });

// 图片关联
User.hasMany(Image, { foreignKey: 'uploadedBy', as: 'uploadedImages' });
Image.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

Product.hasMany(Image, { 
  foreignKey: 'relatedId', 
  scope: { category: 'product' }, 
  as: 'productImages'
});

Policy.hasMany(Image, { 
  foreignKey: 'relatedId', 
  scope: { category: 'policy' }, 
  as: 'policyImages'
});

// 同步数据库模型
const syncDatabase = async () => {
  try {
    // 同步所有模型到数据库
    // force: true 将会先删除表再创建（谨慎在生产环境使用）
    // alter: true 将会更新表结构而不删除数据
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步成功');
  } catch (error) {
    console.error('数据库模型同步失败:', error);
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
  syncDatabase
}; 