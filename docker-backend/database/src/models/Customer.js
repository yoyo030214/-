const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'merchants',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    memberLevel: {
      type: DataTypes.ENUM('普通会员', 'VIP会员', '高级会员'),
      defaultValue: '普通会员'
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    lastOrderDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registerDate: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    lastLoginDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('活跃', '不活跃', '新客户'),
      defaultValue: '新客户'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'customers',
    timestamps: true
  });

  return Customer;
}; 