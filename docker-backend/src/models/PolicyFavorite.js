const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PolicyFavorite = sequelize.define('PolicyFavorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  policyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'policies',
      key: 'id'
    }
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
  tableName: 'policy_favorites',
  indexes: [
    {
      name: 'idx_policy_favorites_user',
      fields: ['userId']
    },
    {
      name: 'idx_policy_favorites_policy',
      fields: ['policyId']
    },
    {
      // 确保一个用户只能收藏一个政策一次
      name: 'unique_user_policy',
      unique: true,
      fields: ['userId', 'policyId']
    }
  ]
});

module.exports = PolicyFavorite; 