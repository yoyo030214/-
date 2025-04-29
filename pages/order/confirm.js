const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    // 地址信息
    address: null,
    
    // 商品信息
    cartList: [],
    totalPrice: 0,
    shippingFee: 0,
    
    // 订单信息
    remark: '',
    
    // 状态控制
    loading: false,
    submitting: false
  },

  onLoad(options) {
    if (options.items) {
      const items = JSON.parse(options.items);
      this.setData({ products: items });
    }
    this.loadAddressList();
    this.calculateAmount();
    this.loadOrderData();
  },

  onShow() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.route === 'pages/address/address') {
      const { selectedAddress } = prevPage.data;
      if (selectedAddress) {
        this.setData({
          address: selectedAddress
        });
      }
    }
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: '/api/address',
        method: 'GET'
      });

      const addressList = res.data;
      // 设置默认地址
      const defaultAddress = addressList.find(item => item.isDefault);
      if (defaultAddress) {
        this.setData({
          address: defaultAddress,
          addressList
        });
      } else if (addressList.length > 0) {
        this.setData({
          address: addressList[0],
          addressList
        });
      }
    } catch (error) {
      showError('加载地址列表失败');
    } finally {
      hideLoading();
    }
  },

  // 选择收货地址
  onSelectAddress() {
    wx.navigateTo({
      url: '/pages/address/address?from=order'
    });
  },

  // 添加新地址
  addAddress() {
    wx.navigateTo({
      url: '/pages/address/address'
    });
  },

  // 编辑地址
  editAddress() {
    if (!this.data.address) return;
    wx.navigateTo({
      url: `/pages/address/address?id=${this.data.address.id}`
    });
  },

  // 计算金额
  calculateAmount() {
    const { products } = this.data;
    let totalAmount = 0;
    let freightAmount = 0;
    let discountAmount = 0;

    // 计算商品总额
    products.forEach(item => {
      totalAmount += item.price * item.quantity;
    });

    // 计算运费
    if (totalAmount < 100) {
      freightAmount = 10;
    }

    // 计算优惠金额
    if (totalAmount >= 200) {
      discountAmount = totalAmount * 0.1; // 满200减10%
    }

    // 计算实付金额
    const actualAmount = totalAmount + freightAmount - discountAmount;

    this.setData({
      totalAmount,
      freightAmount,
      discountAmount,
      actualAmount
    });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    });
  },

  // 选择支付方式
  onPaymentMethodChange(e) {
    const { method } = e.currentTarget.dataset;
    this.setData({
      paymentMethod: method
    });
  },

  // 提交订单
  async onSubmitOrder() {
    if (!this.data.address) {
      showError('请选择收货地址');
      return;
    }

    try {
      this.setData({ loading: true });
      const res = await request({
        url: '/api/orders',
        method: 'POST',
        data: {
          addressId: this.data.address.id,
          products: this.data.products,
          remark: this.data.remark,
          paymentMethod: this.data.paymentMethod,
          totalAmount: this.data.totalAmount,
          freightAmount: this.data.freightAmount,
          discountAmount: this.data.discountAmount,
          actualAmount: this.data.actualAmount
        }
      });

      // 跳转到支付页面
      wx.navigateTo({
        url: `/pages/payment/payment?orderId=${res.data.id}`
      });
    } catch (error) {
      showError('提交订单失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载订单数据
  async loadOrderData() {
    try {
      this.setData({ loading: true })
      
      // 获取购物车数据
      const cartRes = await wx.cloud.callFunction({
        name: 'cart',
        data: {
          action: 'list'
        }
      })
      
      if (!cartRes.result || !cartRes.result.success) {
        throw new Error(cartRes.result?.message || '获取购物车数据失败')
      }
      
      // 计算商品总价
      const totalPrice = cartRes.result.data.reduce((sum, item) => {
        return sum + (item.price * item.quantity)
      }, 0)
      
      // 获取默认地址
      const addressRes = await wx.cloud.callFunction({
        name: 'address',
        data: {
          action: 'getDefault'
        }
      })
      
      this.setData({
        loading: false,
        cartList: cartRes.result.data,
        totalPrice,
        address: addressRes.result?.data || null
      })
    } catch (error) {
      console.error('加载订单数据失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载订单数据失败',
        icon: 'none'
      })
    }
  },

  // 选择地址
  selectAddress() {
    wx.navigateTo({
      url: '/pages/address/address?from=order'
    })
  },

  // 提交订单
  async submitOrder() {
    try {
      // 表单验证
      if (!this.validateForm()) {
        return
      }
      
      this.setData({ submitting: true })
      
      const { cartList, address, remark } = this.data
      
      // 创建订单
      const res = await wx.cloud.callFunction({
        name: 'order',
        data: {
          action: 'create',
          data: {
            items: cartList,
            address: address,
            remark: remark,
            totalPrice: this.data.totalPrice
          }
        }
      })
      
      if (res.result && res.result.success) {
        // 清空购物车
        await wx.cloud.callFunction({
          name: 'cart',
          data: {
            action: 'clear'
          }
        })
        
        // 跳转到支付页面
        wx.navigateTo({
          url: `/pages/order/payment?id=${res.result.data._id}`
        })
      } else {
        throw new Error(res.result?.message || '创建订单失败')
      }
    } catch (error) {
      console.error('提交订单失败:', error)
      wx.showToast({
        title: error.message || '提交订单失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 表单验证
  validateForm() {
    const { address, cartList } = this.data
    
    if (!address) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      })
      return false
    }
    
    if (!cartList || cartList.length === 0) {
      wx.showToast({
        title: '购物车为空',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 输入备注
  handleRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  }
}); 