Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示动画
    show: {
      type: Boolean,
      value: false
    },
    // 动画起点X坐标
    startX: {
      type: Number,
      value: 0
    },
    // 动画起点Y坐标
    startY: {
      type: Number,
      value: 0
    },
    // 动画终点X坐标（默认为购物车图标位置）
    endX: {
      type: Number,
      value: 0
    },
    // 动画终点Y坐标（默认为购物车图标位置）
    endY: {
      type: Number,
      value: 0
    },
    // 动画持续时间（毫秒）
    duration: {
      type: Number,
      value: 800
    },
    // 动画小球颜色
    color: {
      type: String,
      value: '#1aad19'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    animationData: {},
    isAnimating: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 开始动画
    startAnimation() {
      if (this.data.isAnimating) return;
      
      this.setData({
        isAnimating: true
      });
      
      // 创建动画实例
      const animation = wx.createAnimation({
        duration: this.data.duration,
        timingFunction: 'cubic-bezier(0.5, -0.5, 1, 1)',
        delay: 0
      });
      
      // 设置动画起点
      this.setData({
        left: this.data.startX,
        top: this.data.startY,
        opacity: 1,
        scale: 1
      });
      
      // 执行动画
      setTimeout(() => {
        animation.opacity(0).scale(0.1).translate(
          this.data.endX - this.data.startX, 
          this.data.endY - this.data.startY
        ).step();
        
        this.setData({
          animationData: animation.export()
        });
        
        // 动画结束后重置状态
        setTimeout(() => {
          this.setData({
            isAnimating: false
          });
          this.triggerEvent('animationend');
        }, this.data.duration);
      }, 50);
    },
    
    // 监听属性变化
    observeShow(newVal) {
      if (newVal && !this.data.isAnimating) {
        this.startAnimation();
      }
    }
  },
  
  /**
   * 数据监听器
   */
  observers: {
    'show': function(show) {
      this.observeShow(show);
    }
  }
}) 