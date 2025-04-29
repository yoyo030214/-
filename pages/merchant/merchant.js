Page({
  data: {
    // 商家信息
    merchantInfo: null,
    
    // 商品列表
    productList: [],
    
    // 状态控制
    loading: false
  },

  onLoad() {
    this.loadMerchantData()
  },

  // 加载商家数据
  async loadMerchantData() {
    try {
      this.setData({ loading: true })
      
      // 获取商家信息
      const merchantRes = await wx.cloud.callFunction({
        name: 'merchant',
        data: {
          action: 'getInfo'
        }
      })
      
      if (!merchantRes.result || !merchantRes.result.success) {
        throw new Error(merchantRes.result?.message || '获取商家信息失败')
      }
      
      // 获取商品列表
      const productRes = await wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'list',
          merchantId: merchantRes.result.data._id
        }
      })
      
      if (!productRes.result || !productRes.result.success) {
        throw new Error(productRes.result?.message || '获取商品列表失败')
      }
      
      this.setData({
        loading: false,
        merchantInfo: merchantRes.result.data,
        productList: productRes.result.data
      })
    } catch (error) {
      console.error('加载商家数据失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载商家数据失败',
        icon: 'none'
      })
    }
  }
}) 