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
        }
      }
    }
  },

  data: {
    searchValue: '',
    searchResults: [],
    cityGroups: [
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
    ]
  },

  methods: {
    onCityTap(e) {
      const city = e.currentTarget.dataset.city;
      this.triggerEvent('citySelect', { city });
      this.triggerEvent('close');
    },

    onClose() {
      this.triggerEvent('close');
    },

    onSearch(e) {
      const value = e.detail.value;
      this.setData({ searchValue: value });
      
      if (value) {
        // 从所有城市组中搜索
        const allCities = this.data.cityGroups.reduce((acc, group) => {
          return acc.concat(group.cities);
        }, []);
        
        const results = allCities.filter(city => 
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