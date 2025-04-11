const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Policy = sequelize.define('Policy', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  publishDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  applicationUrl: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'policies',
  indexes: [
    {
      name: 'idx_policies_category',
      fields: ['category']
    },
    {
      name: 'idx_policies_publish_date',
      fields: ['publishDate']
    }
  ]
});

module.exports = Policy; 