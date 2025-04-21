const { sequelize } = require('../config/database');
const User = require('./User');
const Policy = require('./Policy');
const FarmerStory = require('./FarmerStory');
const FarmerProduct = require('./FarmerProduct');

// 用户和农产品的关系
User.hasMany(FarmerProduct, {
  foreignKey: 'merchant_id',
  as: 'products'
});
FarmerProduct.belongsTo(User, {
  foreignKey: 'merchant_id',
  as: 'merchant'
});

// 用户和农户故事的关系
User.hasMany(FarmerStory, {
  foreignKey: 'merchant_id',
  as: 'stories'
});
FarmerStory.belongsTo(User, {
  foreignKey: 'merchant_id',
  as: 'merchant'
});

// 农产品和农户故事的关系
FarmerProduct.hasMany(FarmerStory, {
  foreignKey: 'related_product_id',
  as: 'stories'
});
FarmerStory.belongsTo(FarmerProduct, {
  foreignKey: 'related_product_id',
  as: 'product'
});

module.exports = {
  sequelize,
  User,
  Policy,
  FarmerStory,
  FarmerProduct
}; 