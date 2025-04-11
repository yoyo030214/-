module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
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
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    merchant_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_on_sale: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sales_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // 添加季节相关字段
    seasons: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['all'],
      validate: {
        isValidSeasons(value) {
          const validSeasons = ['spring', 'summer', 'autumn', 'winter', 'all'];
          if (!Array.isArray(value)) {
            throw new Error('seasons必须是数组');
          }
          if (!value.every(season => validSeasons.includes(season))) {
            throw new Error('无效的季节值');
          }
        }
      }
    },
    // 添加地理位置字段
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    // 添加产品特性字段
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    // 添加营养成分字段
    nutrition: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // 添加生产环境信息字段
    environment: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // 添加生产过程字段
    process: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    // 添加文化背景字段
    culture: {
      type: DataTypes.TEXT
    },
    // 添加标签字段
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    }
  }, {
    tableName: 'products',
    underscored: true,
    timestamps: true
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    Product.belongsTo(models.Merchant, {
      foreignKey: 'merchant_id',
      as: 'merchant'
    });
    Product.hasMany(models.ProductImage, {
      foreignKey: 'product_id',
      as: 'images'
    });
    Product.hasMany(models.OrderItem, {
      foreignKey: 'product_id',
      as: 'orderItems'
    });
  };

  return Product;
}; 