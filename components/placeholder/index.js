Component({
  properties: {
    type: {
      type: String,
      value: 'rect' // rect | circle
    },
    width: {
      type: String,
      value: '200rpx'
    },
    height: {
      type: String,
      value: '200rpx'
    },
    bgColor: {
      type: String,
      value: '#f5f5f5'
    },
    showText: {
      type: Boolean,
      value: false
    },
    text: {
      type: String,
      value: '图片加载中'
    },
    textColor: {
      type: String,
      value: '#999'
    }
  }
}) 