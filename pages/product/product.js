Page({
  data: {
    product: {}  // 从首页传递过来的商品数据
  },

  onLoad(options) {
    // 获取商品ID
    const id = options.id;
    
    // 模拟数据（实际应从API获取）
    this.setData({
      product: {
        id: id,
        name: `商品${id}`,
        price: 100 + id,
        description: `这是商品${id}的描述`
      }
    });
  },

  addToCart() {
    wx.showToast({ title: '加入购物车成功' });
  }
});