'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = [
      {
        name: '时令水果',
        icon: '/images/categories/fruits.png',
        sort: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '新鲜蔬菜',
        icon: '/images/categories/vegetables.png',
        sort: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '粮油调味',
        icon: '/images/categories/grocery.png',
        sort: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '地方特产',
        icon: '/images/categories/specialty.png',
        sort: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('categories', categories, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
}; 