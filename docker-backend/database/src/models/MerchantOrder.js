const { Model, DataTypes } = require('sequelize');

class MerchantOrder extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
      },
      shipping_address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      merchant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'merchants',
          key: 'id'
        }
      },
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      tableName: 'merchant_orders',
      timestamps: true,
      underscored: true
    });
  }
}

module.exports = MerchantOrder; 