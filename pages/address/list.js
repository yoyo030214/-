const { request } = require('../../utils/request');
const { showError, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    addressList: [],
    loading: false
  },

  onLoad() {
    this.loadAddressList();
  },

  onShow() {
    this.loadAddressList();
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: '/api/address',
        method: 'GET'
      });
      this.setData({
        addressList: res.data
      });
    } catch (error) {
      showError('加载地址列表失败');
    } finally {
      hideLoading();
    }
  },

  // 新增地址
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address/edit'
    });
  },

  // 编辑地址
  onEditAddress(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/address/edit?id=${id}`
    });
  },

  // 删除地址
  async onDeleteAddress(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            showLoading('删除中...');
            await request({
              url: `/api/address/${id}`,
              method: 'DELETE'
            });

            // 更新列表
            const addressList = this.data.addressList.filter(item => item.id !== id);
            this.setData({ addressList });
          } catch (error) {
            showError('删除地址失败');
          } finally {
            hideLoading();
          }
        }
      }
    });
  },

  // 设为默认地址
  async onSetDefault(e) {
    const { id } = e.currentTarget.dataset;
    try {
      showLoading('设置中...');
      await request({
        url: `/api/address/${id}/default`,
        method: 'PUT'
      });

      // 更新列表
      const addressList = this.data.addressList.map(item => ({
        ...item,
        isDefault: item.id === id
      }));
      this.setData({ addressList });
    } catch (error) {
      showError('设置默认地址失败');
    } finally {
      hideLoading();
    }
  }
}); 