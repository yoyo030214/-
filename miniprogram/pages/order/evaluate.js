const app = getApp();
const { request } = require('../../utils/request');
const { showLoading, hideLoading, showError } = require('../../utils/util');

Page({
  data: {
    orderId: '',
    productId: '',
    productInfo: null,
    rating: 5,
    content: '',
    images: [],
    loading: true,
    uploadProgress: 0,
    isUploading: false
  },

  onLoad(options) {
    if (options.orderId && options.productId) {
      this.setData({
        orderId: options.orderId,
        productId: options.productId
      });
      this.loadProductInfo();
    }
  },

  // 加载商品信息
  async loadProductInfo() {
    try {
      showLoading('加载中...');
      const res = await request({
        url: `/api/product/detail/${this.data.productId}`
      });

      if (res.success) {
        this.setData({
          productInfo: res.data,
          loading: false
        });
      } else {
        showError(res.message || '加载失败');
        this.setData({ loading: false });
      }
    } catch (error) {
      showError('网络错误');
      this.setData({ loading: false });
    } finally {
      hideLoading();
    }
  },

  // 评分变化
  onRatingChange(e) {
    this.setData({
      rating: e.detail.value
    });
  },

  // 评价内容变化
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 选择图片
  async chooseImage() {
    if (this.data.isUploading) {
      showError('图片上传中,请稍候');
      return;
    }

    try {
      const res = await wx.chooseImage({
        count: 9 - this.data.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      // 压缩图片
      const compressedImages = await Promise.all(
        res.tempFilePaths.map(path => this.compressImage(path))
      );

      // 上传图片
      this.setData({ isUploading: true });
      const uploadTasks = compressedImages.map((path, index) => {
        return new Promise((resolve, reject) => {
          const uploadTask = wx.uploadFile({
            url: `${app.globalData.baseUrl}/api/upload`,
            filePath: path,
            name: 'file',
            success: (res) => {
              const data = JSON.parse(res.data);
              if (data.success) {
                resolve(data.data.url);
              } else {
                reject(new Error(data.message));
              }
            },
            fail: reject
          });

          // 监听上传进度
          uploadTask.onProgressUpdate((res) => {
            const progress = Math.floor((res.progress * (index + 1)) / compressedImages.length);
            this.setData({ uploadProgress: progress });
          });
        });
      });

      const urls = await Promise.all(uploadTasks);
      this.setData({
        images: [...this.data.images, ...urls],
        isUploading: false,
        uploadProgress: 0
      });
    } catch (error) {
      showError('上传图片失败');
      this.setData({ 
        isUploading: false,
        uploadProgress: 0
      });
    }
  },

  // 压缩图片
  async compressImage(path) {
    try {
      const res = await wx.compressImage({
        src: path,
        quality: 80,
        compressedWidth: 800
      });
      return res.tempFilePath;
    } catch (error) {
      console.error('压缩图片失败:', error);
      return path;
    }
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    wx.previewImage({
      current,
      urls: this.data.images
    });
  },

  // 提交评价
  async submitEvaluate() {
    if (!this.data.content.trim()) {
      showError('请输入评价内容');
      return;
    }

    if (this.data.content.length < 10) {
      showError('评价内容至少10个字');
      return;
    }

    try {
      showLoading('提交中...');
      const res = await request({
        url: '/api/order/evaluate',
        method: 'POST',
        data: {
          orderId: this.data.orderId,
          productId: this.data.productId,
          rating: this.data.rating,
          content: this.data.content,
          images: this.data.images
        }
      });

      if (res.success) {
        wx.showToast({
          title: '评价成功',
          icon: 'success'
        });
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showError(res.message || '评价失败');
      }
    } catch (error) {
      showError('网络错误');
    } finally {
      hideLoading();
    }
  }
}); 