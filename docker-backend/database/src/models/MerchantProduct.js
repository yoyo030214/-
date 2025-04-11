const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MerchantProduct = sequelize.define('MerchantProduct', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '个'
    },
    images: {
      type: DataTypes.STRING,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('images');
        return rawValue ? rawValue.split(',') : [];
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('images', value.join(','));
        } else {
          this.setDataValue('images', value);
        }
      }
    },
    isOnSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    salesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'merchant_products',
    timestamps: true
  });

  return MerchantProduct;
}; 