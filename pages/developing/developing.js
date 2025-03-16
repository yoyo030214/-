Page({
  data: {
    pageTitle: '开发中'
  },

  onLoad: function(options) {
    let title = '开发中';
    // 获取当前页面路径
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 根据来源设置标题
    if (options.title) {
      title = options.title;
    } else {
      // 如果是从tabBar进入，根据tab的text设置标题
      const tabList = getApp().__wxConfig.tabBar.list;
      const currentPath = '/' + currentPage.route;
      const currentTab = tabList.find(tab => '/' + tab.pagePath === currentPath);
      if (currentTab) {
        title = currentTab.text + '功能开发中';
      }
    }

    // 设置页面标题
    this.setData({ pageTitle: title });
    wx.setNavigationBarTitle({ title });
  }
}); 