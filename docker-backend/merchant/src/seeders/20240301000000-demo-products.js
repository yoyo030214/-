'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const merchants = await queryInterface.sequelize.query(
      `SELECT id FROM merchants;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const currentMonth = new Date().getMonth() + 1;
    let season;
    if (currentMonth >= 3 && currentMonth <= 5) {
      season = 'spring';
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      season = 'summer';
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      season = 'autumn';
    } else {
      season = 'winter';
    }

    const products = [
      {
        merchantId: merchants[0].id,
        name: '新鲜草莓',
        description: '当季新鲜草莓，酸甜可口',
        price: 39.9,
        stock: 100,
        salesCount: 50,
        images: ['/images/products/strawberry.jpg'],
        isOnSale: true,
        isSeasonal: true,
        season: 'spring',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        merchantId: merchants[1].id,
        name: '西瓜',
        description: '夏日解暑必备，清甜多汁',
        price: 2.5,
        stock: 200,
        salesCount: 100,
        images: ['/images/products/watermelon.jpg'],
        isOnSale: true,
        isSeasonal: true,
        season: 'summer',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        merchantId: merchants[2].id,
        name: '红富士苹果',
        description: '秋季应季水果，脆甜可口',
        price: 5.9,
        stock: 150,
        salesCount: 80,
        images: ['/images/products/apple.jpg'],
        isOnSale: true,
        isSeasonal: true,
        season: 'autumn',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        merchantId: merchants[3].id,
        name: '橙子',
        description: '冬季应季水果，富含维C',
        price: 4.9,
        stock: 180,
        salesCount: 90,
        images: ['/images/products/orange.jpg'],
        isOnSale: true,
        isSeasonal: true,
        season: 'winter',
        latitude: 29.7247,
        longitude: 114.3162,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('merchant_products', products, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('merchant_products', null, {});
  }
}; 