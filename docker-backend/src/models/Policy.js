const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Policy = sequelize.define('Policy', {
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
  type: {
    type: DataTypes.ENUM('merchant', 'user', 'platform', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  publishDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['publishDate']
    }
  ]
});

module.exports = Policy; 