const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

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
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('vegetables', 'fruits', 'grains', 'livestock', 'aquatic', 'other'),
    allowNull: false
  },
  sub_category: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'sold_out', 'discontinued'),
    defaultValue: 'available'
  },
  origin: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shelf_life: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  storage_method: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  merchant_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  merchant_contact: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  merchant_location: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'farmer_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = FarmerProduct; 