const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Policy = sequelize.define('Policy', {
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
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('planting', 'machinery', 'animal', 'industry', 'land', 'green', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  publish_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  effective_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  expiration_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'policies',
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
      fields: ['publish_date']
    }
  ]
});

module.exports = Policy; 