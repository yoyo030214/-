const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FarmerProduct = sequelize.define('FarmerProduct', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  sub_category: {
    type: DataTypes.STRING(50)
  },
  origin: {
    type: DataTypes.STRING(255)
  },
  shelf_life: {
    type: DataTypes.STRING(50)
  },
  storage_method: {
    type: DataTypes.STRING(255)
  },
  farmer_id: {
    type: DataTypes.INTEGER
  },
  farmer_name: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = FarmerProduct; 