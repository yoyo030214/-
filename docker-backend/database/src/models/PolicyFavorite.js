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
    },
    field: 'user_id'
  },
  policyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'policies',
      key: 'id'
    },
    field: 'policy_id'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'policy_favorites',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'policy_id']
    }
  ]
});

module.exports = PolicyFavorite; 