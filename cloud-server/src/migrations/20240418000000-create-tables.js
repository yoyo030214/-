'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'merchant', 'farmer'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('policies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('planting', 'machinery', 'animal', 'industry', 'land', 'green', 'other'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
      },
      publish_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      effective_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      expiration_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('farmer_stories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('success', 'technology', 'experience', 'other'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft'
      },
      related_product_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      merchant_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      merchant_contact: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      merchant_location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      province: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      district: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      view_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('farmer_products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('vegetables', 'fruits', 'grains', 'livestock', 'aquatic', 'other'),
        allowNull: false
      },
      sub_category: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('available', 'sold_out', 'discontinued'),
        defaultValue: 'available'
      },
      merchant_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      origin: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      shelf_life: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      storage_method: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      merchant_name: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      merchant_contact: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      merchant_location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 创建索引
    await queryInterface.addIndex('policies', ['title']);
    await queryInterface.addIndex('policies', ['type']);
    await queryInterface.addIndex('policies', ['status']);
    await queryInterface.addIndex('policies', ['publish_date']);
    
    await queryInterface.addIndex('farmer_stories', ['title']);
    await queryInterface.addIndex('farmer_stories', ['type']);
    await queryInterface.addIndex('farmer_stories', ['status']);
    await queryInterface.addIndex('farmer_stories', ['created_at']);
    
    await queryInterface.addIndex('farmer_products', ['name']);
    await queryInterface.addIndex('farmer_products', ['category']);
    await queryInterface.addIndex('farmer_products', ['status']);
    await queryInterface.addIndex('farmer_products', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('farmer_products');
    await queryInterface.dropTable('farmer_stories');
    await queryInterface.dropTable('policies');
    await queryInterface.dropTable('users');
  }
}; 