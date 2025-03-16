Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    hotCities: {
      type: Array,
      value: ['北京市', '上海市', '广州市', '深圳市', '武汉市', '成都市', '重庆市', '杭州市']
    }
  },

  data: {
    searchValue: '',
    searchResults: []
  },

  methods: {
    onCityTap(e) {
      const city = e.currentTarget.dataset.city;
      this.triggerEvent('citySelect', { city });
      this.setData({ show: false });
    },

    onClose() {
      this.setData({ show: false });
    },

    onSearch(e) {
      const value = e.detail.value;
      this.setData({ searchValue: value });
      // 这里可以接入城市搜索API
      // 目前仅做简单的本地过滤
      if (value) {
        const results = this.data.hotCities.filter(city => 
          city.includes(value)
        );
        this.setData({ searchResults: results });
      } else {
        this.setData({ searchResults: [] });
      }
    }
  }
}); 