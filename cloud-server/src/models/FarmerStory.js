const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FarmerStory = sequelize.define('FarmerStory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('success', 'technology', 'experience', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  related_product_id: {
    type: DataTypes.INTEGER,
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
  },
  province: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'farmer_stories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['title']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = FarmerStory; 