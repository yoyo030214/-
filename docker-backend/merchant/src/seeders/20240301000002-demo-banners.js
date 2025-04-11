'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const banners = [
      {
        title: '春季特惠',
        imageUrl: '/images/banners/spring.jpg',
        linkUrl: '/pages/seasonal/index?season=spring',
        sort: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '夏季特惠',
        imageUrl: '/images/banners/summer.jpg',
        linkUrl: '/pages/seasonal/index?season=summer',
        sort: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '秋季特惠',
        imageUrl: '/images/banners/autumn.jpg',
        linkUrl: '/pages/seasonal/index?season=autumn',
        sort: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '冬季特惠',
        imageUrl: '/images/banners/winter.jpg',
        linkUrl: '/pages/seasonal/index?season=winter',
        sort: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('banners', banners, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('banners', null, {});
  }
}; 