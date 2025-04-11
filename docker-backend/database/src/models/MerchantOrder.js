const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MerchantOrder = sequelize.define('MerchantOrder', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'merchants',
        key: 'id'
      }
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('待处理', '处理中', '已发货', '已送达', '已完成', '已取消'),
      defaultValue: '待处理'
    },
    paymentStatus: {
      type: DataTypes.ENUM('未支付', '已支付', '部分退款', '已退款'),
      defaultValue: '未支付'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shippingFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    shippingMethod: {
      type: DataTypes.STRING,
      allowNull: true
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    orderDate: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    processingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shippingDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionDate: {
      type: DataTypes.DATE,
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
    tableName: 'merchant_orders',
    timestamps: true
  });

  return MerchantOrder;
}; 