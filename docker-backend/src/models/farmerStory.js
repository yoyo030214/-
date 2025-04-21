const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FarmerStory = sequelize.define('FarmerStory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true
  },
  farmerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('farm', 'product', 'merchant', 'other'),
    defaultValue: 'farm'
  },
  relatedProductId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'FarmerProducts',
      key: 'id'
    }
  },
  merchantInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  comments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['farmerId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = FarmerStory; 