const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  farmer_id: {
    type: DataTypes.INTEGER
  },
  farmer_name: {
    type: DataTypes.STRING(100)
  },
  location: {
    type: DataTypes.STRING(255)
  },
  type: {
    type: DataTypes.ENUM('story', 'experience', 'news'),
    defaultValue: 'story'
  },
  related_product_id: {
    type: DataTypes.INTEGER
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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

module.exports = FarmerStory; 