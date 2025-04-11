'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const merchants = [
      {
        storeName: '春天果园',
        contactPhone: '13800138000',
        address: '武汉市洪山区光谷大道',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        storeName: '夏日水果店',
        contactPhone: '13800138001',
        address: '武汉市武昌区水果湖',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        storeName: '秋天果园',
        contactPhone: '13800138002',
        address: '武汉市江夏区纸坊',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        storeName: '冬天水果店',
        contactPhone: '13800138003',
        address: '武汉市汉阳区钟家村',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('merchants', merchants, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('merchants', null, {});
  }
}; 