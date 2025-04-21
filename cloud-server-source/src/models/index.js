const User = require('./User');
const Policy = require('./Policy');
const FarmerStory = require('./FarmerStory');
const FarmerProduct = require('./FarmerProduct');

// 定义模型关联
User.hasMany(FarmerStory, { foreignKey: 'farmer_id' });
FarmerStory.belongsTo(User, { foreignKey: 'farmer_id' });

User.hasMany(FarmerProduct, { foreignKey: 'farmer_id' });
FarmerProduct.belongsTo(User, { foreignKey: 'farmer_id' });

FarmerStory.belongsTo(FarmerProduct, { foreignKey: 'related_product_id' });
FarmerProduct.hasMany(FarmerStory, { foreignKey: 'related_product_id' });

module.exports = {
  User,
  Policy,
  FarmerStory,
  FarmerProduct
}; 