Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.setData({
            searchValue: '',
            searchResults: []
          });
          // 从缓存加载城市数据
          this.loadCityData();
        }
      }
    }
  },

  data: {
    searchValue: '',
    searchResults: [],
    cityGroups: [],
    allCities: [], // 用于搜索的城市列表
    lastSearchTime: 0 // 上次搜索时间
  },

  lifetimes: {
    attached() {
      // 组件加载时初始化城市数据
      this.loadCityData();
    }
  },

  methods: {
    loadCityData() {
      // 尝试从缓存获取城市数据
      const cachedData = wx.getStorageSync('cityPickerData');
      const cacheTime = wx.getStorageSync('cityPickerDataTime');
      const now = Date.now();
      
      // 如果缓存存在且未过期（24小时）
      if (cachedData && cacheTime && (now - cacheTime < 24 * 60 * 60 * 1000)) {
        this.setData({
          cityGroups: cachedData.cityGroups,
          allCities: cachedData.allCities
        });
        return;
      }

      // 如果没有缓存或缓存过期，使用默认数据
      const defaultCityGroups = [
        {
          title: '热门城市',
          cities: ['武汉市', '北京市', '上海市', '广州市', '深圳市']
        },
        {
          title: '湖北省',
          cities: [
            '武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', 
            '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', 
            '咸宁市', '随州市', '恩施土家族苗族自治州', '仙桃市', 
            '潜江市', '天门市', '神农架林区'
          ]
        }
      ];

      // 构建用于搜索的城市列表
      const allCities = defaultCityGroups.reduce((acc, group) => {
        return acc.concat(group.cities);
      }, []);

      // 更新数据并缓存
      this.setData({
        cityGroups: defaultCityGroups,
        allCities: allCities
      });

      wx.setStorageSync('cityPickerData', {
        cityGroups: defaultCityGroups,
        allCities: allCities
      });
      wx.setStorageSync('cityPickerDataTime', now);
    },

    onCityTap(e) {
      const city = e.currentTarget.dataset.city;
      // 先触发选择事件
      this.triggerEvent('citySelect', { city });
      // 延迟关闭选择器，确保选择事件被处理
      setTimeout(() => {
        this.triggerEvent('close');
      }, 100);
    },

    onClose() {
      this.triggerEvent('close');
    },

    onSearch(e) {
      const value = e.detail.value;
      const now = Date.now();
      
      // 如果搜索间隔小于300ms，不执行搜索
      if (now - this.data.lastSearchTime < 300) {
        return;
      }
      
      this.setData({ 
        searchValue: value,
        lastSearchTime: now
      });
      
      if (value) {
        // 使用缓存的allCities进行搜索
        const results = this.data.allCities.filter(city => 
          city.includes(value)
        );
        
        // 去重
        const uniqueResults = [...new Set(results)];
        
        this.setData({ searchResults: uniqueResults });
      } else {
        this.setData({ searchResults: [] });
      }
    }
  }
}); 