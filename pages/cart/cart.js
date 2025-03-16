const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');
const config = require('../../utils/config');

Page({
  data: {
    cartList: [],
    selectedAll: false,
    totalPrice: 0,
    totalCount: 0,
    loading: false,
    pageTitle: '购物车功能开发中'
  },

  onLoad() {
    this.loadCartList();
  },

  onShow() {
    this.loadCartList();
  },

  // 加载购物车列表
  async loadCartList() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: '/api/cart',
        method: 'GET'
      });
      this.setData({
        cartList: res.data
      });
      this.calculateTotal();
    } catch (error) {
      showError('加载购物车失败');
    } finally {
      hideLoading();
    }
  },

  // 选择商品
  onSelectItem(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    cartList[index].selected = !cartList[index].selected;
    this.setData({ cartList });
    this.calculateTotal();
  },

  // 全选/取消全选
  onSelectAll() {
    const { cartList, selectedAll } = this.data;
    const newSelectedAll = !selectedAll;
    cartList.forEach(item => {
      item.selected = newSelectedAll;
    });
    this.setData({
      cartList,
      selectedAll: newSelectedAll
    });
    this.calculateTotal();
  },

  // 修改商品数量
  async onQuantityChange(e) {
    const { index, type } = e.currentTarget.dataset;
    const { cartList } = this.data;
    const item = cartList[index];
    let newQuantity = item.quantity;

    if (type === 'minus' && newQuantity > 1) {
      newQuantity--;
    } else if (type === 'plus' && newQuantity < item.stock) {
      newQuantity++;
    } else {
      return;
    }

    try {
      showLoading('更新中...');
      await request({
        url: `/api/cart/${item.id}`,
        method: 'PUT',
        data: { quantity: newQuantity }
      });

      cartList[index].quantity = newQuantity;
      this.setData({ cartList });
      this.calculateTotal();
    } catch (error) {
      showError('更新数量失败');
    } finally {
      hideLoading();
    }
  },

  // 删除商品
  async onDeleteItem(e) {
    const { index } = e.currentTarget.dataset;
    const { cartList } = this.data;
    const item = cartList[index];

    wx.showModal({
      title: '提示',
      content: '确定要删除这个商品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('删除中...');
            await request({
              url: `/api/cart/${item.id}`,
              method: 'DELETE'
            });

            cartList.splice(index, 1);
            this.setData({ cartList });
            this.calculateTotal();
          } catch (error) {
            showError('删除失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  },

  // 清空购物车
  async onClearCart() {
    if (this.data.cartList.length === 0) return;

    wx.showModal({
      title: '提示',
      content: '确定要清空购物车吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('清空中...');
            await request({
              url: '/api/cart/clear',
              method: 'POST'
            });

            this.setData({
              cartList: [],
              selectedAll: false,
              totalPrice: 0,
              totalCount: 0
            });
          } catch (error) {
            showError('清空失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  },

  // 计算总价和总数量
  calculateTotal() {
    const { cartList } = this.data;
    let totalPrice = 0;
    let totalCount = 0;
    let selectedAll = true;

    cartList.forEach(item => {
      if (item.selected) {
        totalPrice += item.price * item.quantity;
        totalCount += item.quantity;
      } else {
        selectedAll = false;
      }
    });

    this.setData({
      totalPrice,
      totalCount,
      selectedAll
    });
  },

  // 去结算
  onCheckout() {
    const { cartList, totalCount } = this.data;
    if (totalCount === 0) {
      showError('请选择要结算的商品');
      return;
    }

    const selectedItems = cartList.filter(item => item.selected);
    wx.navigateTo({
      url: '/pages/order/confirm?items=' + JSON.stringify(selectedItems)
    });
  }
}); 