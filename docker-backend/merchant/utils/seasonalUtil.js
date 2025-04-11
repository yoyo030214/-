/**
 * 季节识别工具类
 */

// 二十四节气的日期（2024年）
const solarTerms2024 = {
  '立春': '2024-02-04',
  '雨水': '2024-02-19',
  '惊蛰': '2024-03-05',
  '春分': '2024-03-20',
  '清明': '2024-04-04',
  '谷雨': '2024-04-20',
  '立夏': '2024-05-05',
  '小满': '2024-05-21',
  '芒种': '2024-06-05',
  '夏至': '2024-06-21',
  '小暑': '2024-07-07',
  '大暑': '2024-07-22',
  '立秋': '2024-08-07',
  '处暑': '2024-08-23',
  '白露': '2024-09-07',
  '秋分': '2024-09-22',
  '寒露': '2024-10-08',
  '霜降': '2024-10-23',
  '立冬': '2024-11-07',
  '小雪': '2024-11-22',
  '大雪': '2024-12-07',
  '冬至': '2024-12-21',
  '小寒': '2024-01-05',
  '大寒': '2024-01-20'
};

// 节气与季节的对应关系
const termToSeason = {
  '立春': 'spring',
  '雨水': 'spring',
  '惊蛰': 'spring',
  '春分': 'spring',
  '清明': 'spring',
  '谷雨': 'spring',
  '立夏': 'summer',
  '小满': 'summer',
  '芒种': 'summer',
  '夏至': 'summer',
  '小暑': 'summer',
  '大暑': 'summer',
  '立秋': 'autumn',
  '处暑': 'autumn',
  '白露': 'autumn',
  '秋分': 'autumn',
  '寒露': 'autumn',
  '霜降': 'autumn',
  '立冬': 'winter',
  '小雪': 'winter',
  '大雪': 'winter',
  '冬至': 'winter',
  '小寒': 'winter',
  '大寒': 'winter'
};

// 季节名称映射
const seasonNames = {
  'spring': '春季',
  'summer': '夏季',
  'autumn': '秋季',
  'winter': '冬季',
  'all': '全年'
};

class SeasonalUtil {
  /**
   * 获取当前节气
   * @returns {Object} 当前节气信息
   */
  static getCurrentTerm() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 获取所有节气日期
    const terms = Object.entries(solarTerms2024).map(([name, date]) => {
      const termDate = new Date(date);
      // 如果是2024年的日期，需要根据当前年份调整
      if (currentYear !== 2024) {
        termDate.setFullYear(currentYear);
      }
      return { name, date: termDate };
    });
    
    // 按日期排序
    terms.sort((a, b) => a.date - b.date);
    
    // 找到当前或下一个节气
    let currentTerm = terms[0];
    let nextTerm = terms[1];
    
    for (let i = 0; i < terms.length; i++) {
      if (terms[i].date > now) {
        currentTerm = terms[i-1] || terms[terms.length-1];
        nextTerm = terms[i];
        break;
      }
    }
    
    return {
      current: {
        name: currentTerm.name,
        date: currentTerm.date,
        season: termToSeason[currentTerm.name]
      },
      next: {
        name: nextTerm.name,
        date: nextTerm.date,
        season: termToSeason[nextTerm.name]
      }
    };
  }

  /**
   * 获取当前季节
   * @returns {string} 季节标识符
   */
  static getCurrentSeason() {
    const { current } = this.getCurrentTerm();
    return current.season;
  }

  /**
   * 获取季节名称
   * @param {string} seasonId 季节标识符
   * @returns {string} 季节中文名称
   */
  static getSeasonName(seasonId) {
    return seasonNames[seasonId] || seasonNames.all;
  }

  /**
   * 判断产品是否为当季产品
   * @param {Object} product 产品信息
   * @returns {boolean} 是否为当季产品
   */
  static isInSeason(product) {
    const currentSeason = this.getCurrentSeason();
    return product.seasons.includes(currentSeason) || product.seasons.includes('all');
  }

  /**
   * 获取产品的季节性标签
   * @param {Object} product 产品信息
   * @returns {Array} 季节性标签列表
   */
  static getSeasonalTags(product) {
    const tags = [];
    if (this.isInSeason(product)) {
      tags.push('当季');
    }
    if (product.seasons.includes('all')) {
      tags.push('全年供应');
    } else {
      product.seasons.forEach(season => {
        tags.push(this.getSeasonName(season));
      });
    }
    return tags;
  }

  /**
   * 获取下一个节气的推荐产品
   * @param {Array} products 产品列表
   * @returns {Array} 推荐产品列表
   */
  static getNextTermRecommendations(products) {
    const { next } = this.getCurrentTerm();
    return products.filter(product => 
      product.seasons.includes(next.season) || 
      product.seasons.includes('all')
    ).map(product => ({
      ...product,
      recommendReason: `即将进入${this.getSeasonName(next.season)}的应季产品`
    }));
  }
}

module.exports = SeasonalUtil; 