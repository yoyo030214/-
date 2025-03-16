Component({
  properties: {
    src: {
      type: String,
      value: ''
    },
    defaultSrc: {
      type: String,
      value: '/images/default_product.webp'
    },
    mode: {
      type: String,
      value: 'aspectFill'
    },
    lazyLoad: {
      type: Boolean,
      value: true
    },
    width: {
      type: String,
      value: '100%'
    },
    height: {
      type: String,
      value: 'auto'
    },
    radius: {
      type: String,
      value: '0'
    },
    showLoading: {
      type: Boolean,
      value: true
    }
  },
  
  data: {
    finalSrc: '',
    loading: true,
    error: false
  },
  
  lifetimes: {
    attached() {
      this.setData({
        finalSrc: this.properties.src || this.properties.defaultSrc,
        loading: true,
        error: false
      });
    }
  },
  
  observers: {
    'src': function(src) {
      if (src) {
        this.setData({
          finalSrc: src,
          loading: true,
          error: false
        });
      } else {
        this.setData({
          finalSrc: this.properties.defaultSrc,
          loading: false,
          error: false
        });
      }
    }
  },
  
  methods: {
    onImageLoad() {
      this.setData({
        loading: false
      });
      
      this.triggerEvent('load', {
        src: this.data.finalSrc
      });
    },
    
    onImageError() {
      console.warn(`图片加载失败: ${this.data.finalSrc}`);
      
      this.setData({
        finalSrc: this.properties.defaultSrc,
        loading: false,
        error: true
      });
      
      this.triggerEvent('error', {
        src: this.properties.src,
        defaultSrc: this.properties.defaultSrc
      });
    },
    
    onImageTap() {
      this.triggerEvent('tap', {
        src: this.data.finalSrc
      });
    }
  }
}); 