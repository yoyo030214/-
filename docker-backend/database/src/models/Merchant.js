const { Model, DataTypes } = require('sequelize');

class Merchant extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      store_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      contact_name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      contact_phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      business_license: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      logo: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      member_level: {
        type: DataTypes.ENUM('basic', 'premium', 'vip'),
        defaultValue: 'basic'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
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
      tableName: 'merchants'
    });
  }
}

module.exports = Merchant; 