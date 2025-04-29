// pages/address/address.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    url: 'https://your-address-management-url.com',
    addressList: [],
    isEdit: false,
    currentAddress: null,
    showAddressForm: false,
    fromPage: '', // 来源页面
    selectMode: false, // 是否为选择模式
    formData: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    },
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.from === 'order') {
      this.setData({
        fromPage: 'order',
        selectMode: true
      });
    }
    if (options.id) {
      this.loadAddressById(options.id);
    }
    this.loadAddressList();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadAddressList();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 处理来自web-view的消息
  onMessage: function(e) {
    // 处理来自web-view的消息
    console.log('收到web-view消息:', e.detail);
  },

  // 处理WebView发送的消息
  handleMessage: function(e) {
    const message = JSON.parse(e.detail.data);
    console.log('收到WebView消息:', message);

    switch(message.action) {
      case 'addressSelected':
        if (message.data.success) {
          // 保存选中的地址
          wx.setStorageSync('selectedAddress', message.data.data);
          // 返回上一页
          wx.navigateBack();
        }
        break;
      case 'addressAdded':
        if (message.data.success) {
          wx.showToast({
            title: '地址添加成功',
            icon: 'success'
          });
        }
        break;
      case 'addressUpdated':
        if (message.data.success) {
          wx.showToast({
            title: '地址更新成功',
            icon: 'success'
          });
        }
        break;
      case 'addressDeleted':
        if (message.data.success) {
          wx.showToast({
            title: '地址删除成功',
            icon: 'success'
          });
        }
        break;
      case 'error':
        wx.showToast({
          title: message.data.message || '操作失败',
          icon: 'none'
        });
        break;
    }
  },

  // 发送消息到WebView
  sendToWebView: function(action, data = {}) {
    this.webViewContext.postMessage({
      action: action,
      data: data
    });
  },

  // 获取地址列表
  getAddresses: function() {
    this.sendToWebView('getAddresses');
  },

  // 添加新地址
  addAddress: function(addressData) {
    this.sendToWebView('addAddress', addressData);
  },

  // 更新地址
  updateAddress: function(addressData) {
    this.sendToWebView('updateAddress', addressData);
  },

  // 删除地址
  deleteAddress: function(addressId) {
    this.sendToWebView('deleteAddress', { id: addressId });
  },

  // 加载地址列表
  async loadAddressList() {
    try {
      this.setData({ loading: true })
      const res = await wx.cloud.callFunction({
        name: 'address',
        data: {
          action: 'list'
        }
      })
      
      if (res.result && res.result.success) {
        // 格式化地址数据
        const formattedList = res.result.data.map(item => ({
          ...item,
          fullAddress: `${item.province}${item.city}${item.district}${item.detail}`,
          isDefault: item.isDefault || false
        }))
        
        this.setData({
          addressList: formattedList,
          loading: false
        })
      } else {
        throw new Error(res.result?.message || '获取地址列表失败')
      }
    } catch (error) {
      console.error('加载地址列表失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '获取地址列表失败',
        icon: 'none'
      })
    }
  },

  // 显示新增地址表单
  showAddForm() {
    this.setData({
      isEdit: false,
      showAddressForm: true,
      formData: {
        name: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail: '',
        isDefault: false
      }
    });
  },

  // 显示编辑地址表单
  showEditForm(address) {
    this.setData({
      isEdit: true,
      showAddressForm: true,
      currentAddress: address,
      formData: {
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
        isDefault: address.isDefault
      }
    });
  },

  // 关闭地址表单
  closeAddressForm() {
    this.setData({
      showAddressForm: false
    });
  },

  // 表单输入处理
  handleInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 选择地区
  chooseRegion() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.province': res.province,
          'formData.city': res.city,
          'formData.district': res.district,
          'formData.detail': res.address
        });
      }
    });
  },

  // 切换默认地址
  toggleDefault() {
    this.setData({
      'formData.isDefault': !this.data.formData.isDefault
    });
  },

  // 保存地址
  async saveAddress() {
    try {
      // 表单验证
      if (!this.validateForm()) {
        return
      }

      this.setData({ loading: true })
      
      const { currentAddress, isEdit } = this.data
      const action = isEdit ? 'update' : 'add'
      
      const res = await wx.cloud.callFunction({
        name: 'address',
        data: {
          action,
          data: {
            ...currentAddress,
            isDefault: currentAddress.isDefault || false
          }
        }
      })

      if (res.result && res.result.success) {
        wx.showToast({
          title: isEdit ? '修改成功' : '添加成功',
          icon: 'success'
        })
        
        // 刷新地址列表
        await this.loadAddressList()
        
        // 关闭表单
        this.closeAddressForm()
      } else {
        throw new Error(res.result?.message || '保存失败')
      }
    } catch (error) {
      console.error('保存地址失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 表单验证
  validateForm() {
    const { currentAddress } = this.data
    const { name, phone, province, city, district, detail } = currentAddress

    if (!name) {
      wx.showToast({
        title: '请输入收货人姓名',
        icon: 'none'
      })
      return false
    }

    if (!phone) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      })
      return false
    }

    // 手机号格式验证
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      })
      return false
    }

    if (!province || !city || !district) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      })
      return false
    }

    if (!detail) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 删除地址
  async deleteAddress(e) {
    try {
      const { id } = e.currentTarget.dataset
      
      const res = await wx.showModal({
        title: '提示',
        content: '确定要删除该地址吗？',
        confirmText: '删除',
        confirmColor: '#ff4d4f'
      })

      if (res.confirm) {
        this.setData({ loading: true })
        
        const deleteRes = await wx.cloud.callFunction({
          name: 'address',
          data: {
            action: 'delete',
            id
          }
        })

        if (deleteRes.result && deleteRes.result.success) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          // 刷新地址列表
          await this.loadAddressList()
        } else {
          throw new Error(deleteRes.result?.message || '删除失败')
        }
      }
    } catch (error) {
      console.error('删除地址失败:', error)
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 设置默认地址
  async setDefaultAddress(e) {
    try {
      const { id } = e.currentTarget.dataset
      
      this.setData({ loading: true })
      
      const res = await wx.cloud.callFunction({
        name: 'address',
        data: {
          action: 'setDefault',
          id
        }
      })

      if (res.result && res.result.success) {
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        })
        
        // 刷新地址列表
        await this.loadAddressList()
      } else {
        throw new Error(res.result?.message || '设置失败')
      }
    } catch (error) {
      console.error('设置默认地址失败:', error)
      wx.showToast({
        title: error.message || '设置失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载指定ID的地址
  loadAddressById(id) {
    wx.cloud.callFunction({
      name: 'address',
      data: {
        action: 'getById',
        id: id
      }
    }).then(res => {
      if (res.result.success) {
        this.showEditForm(res.result.data);
      }
    }).catch(err => {
      console.error('获取地址详情失败：', err);
      wx.showToast({
        title: '获取地址详情失败',
        icon: 'none'
      });
    });
  },

  // 选择地址
  selectAddress(e) {
    const { address } = e.currentTarget.dataset;
    if (this.data.fromPage === 'order') {
      // 如果是订单页面跳转过来的，返回选中的地址
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      prevPage.setData({
        address: address
      });
      wx.navigateBack();
    }
  }
})