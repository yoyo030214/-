const { Model, DataTypes } = require('sequelize');

class MerchantProduct extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id'
        }
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
      is_on_sale: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      sales_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_recommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      sequelize,
      tableName: 'merchant_products',
      timestamps: true,
      underscored: true
    });
  }
}

module.exports = MerchantProduct; 