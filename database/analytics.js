const { policies } = require('./index');

class PolicyAnalytics {
  static getSummary() {
    const allPolicies = Object.values(policies).flatMap(db => db.find());
    
    return {
      total: allPolicies.length,
      byType: this._countBy(allPolicies, 'type'),
      byRegion: this._countBy(allPolicies, 'region'),
      popularTags: this._getPopularTags(allPolicies),
      monthlyTrend: this._getMonthlyTrend(allPolicies)
    };
  }

  static _countBy(data, key) {
    return data.reduce((acc, item) => {
      acc[item[key]] = (acc[item[key]] || 0) + 1;
      return acc;
    }, {});
  }

  static _getPopularTags(data, limit = 5) {
    const tagCounts = data.flatMap(p => p.tags)
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  static _getMonthlyTrend(data) {
    return data.reduce((acc, policy) => {
      const month = policy.date.slice(0, 7); // 获取YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = PolicyAnalytics; 