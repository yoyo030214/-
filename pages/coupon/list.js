Page({
  data: {
    showDevTips: true
  },
  onLoad() {
    // 预留数据加载逻辑
    if (!this.data.showDevTips) {
      this.loadCoupons();
    }
  },
  loadCoupons() {
    // 后续开发时添加数据加载逻辑
  }
}) 