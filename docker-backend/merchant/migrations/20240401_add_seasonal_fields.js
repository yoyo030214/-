'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 添加seasons字段
      await queryInterface.addColumn('products', 'seasons', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: ['all'],
        allowNull: false
      }, { transaction });

      // 添加地理位置字段
      await queryInterface.addColumn('products', 'latitude', {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('products', 'longitude', {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      }, { transaction });

      // 添加产品特性字段
      await queryInterface.addColumn('products', 'features', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      }, { transaction });

      // 添加营养成分字段
      await queryInterface.addColumn('products', 'nutrition', {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      }, { transaction });

      // 添加生产环境信息字段
      await queryInterface.addColumn('products', 'environment', {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      }, { transaction });

      // 添加生产过程字段
      await queryInterface.addColumn('products', 'process', {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      }, { transaction });

      // 添加文化背景字段
      await queryInterface.addColumn('products', 'culture', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      // 添加标签字段
      await queryInterface.addColumn('products', 'tags', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('products', 'seasons', { transaction });
      await queryInterface.removeColumn('products', 'latitude', { transaction });
      await queryInterface.removeColumn('products', 'longitude', { transaction });
      await queryInterface.removeColumn('products', 'features', { transaction });
      await queryInterface.removeColumn('products', 'nutrition', { transaction });
      await queryInterface.removeColumn('products', 'environment', { transaction });
      await queryInterface.removeColumn('products', 'process', { transaction });
      await queryInterface.removeColumn('products', 'culture', { transaction });
      await queryInterface.removeColumn('products', 'tags', { transaction });
    });
  }
}; 