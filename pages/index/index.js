Page({
  data: {
    products: [        // 模拟数据
      { id: 1, name: '恩施玉露茶', image: '/images/tea.jpg', price: 128 },
      { id: 2, name: '潜江小龙虾', image: '/images/shrimp.jpg', price: 98 }
    ]
  },

  onLoad: function() {
    // 可在此处调用API获取真实数据
  },

  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    });
  }
});