const LOCAL_POLICIES = {
  planting: [
    {
      id: 1,
      title: "湖北省水稻种植补贴政策",
      summary: "对连片种植水稻面积达50亩以上的经营主体，按每亩200元标准给予补贴...",
      region: "湖北省",
      date: "2023-09-01",
      tags: ["水稻", "规模种植", "直补到户"],
      content: `一、补贴对象\n全省范围内水稻种植面积达50亩以上的新型农业经营主体...`
    },
    // 其他种植政策...
  ],
  machinery: [
    {
      id: 101,
      title: "湖南省农机购置补贴方案",
      summary: "对购置列入补贴目录的农机具，按不超过销售价格的30%给予补贴...",
      region: "湖南省",
      date: "2023-08-15",
      tags: ["农机具", "购置补贴"],
      content: `第一条 补贴范围\n1. 拖拉机类：50马力及以上轮式拖拉机...`
    }
  ],
  // 其他分类政策...
}

const SAMPLE_POLICIES = [
  {
    id: 1,
    type: 'planting',
    title: '水稻种植补贴',
    date: '2023-09-01',
    region: '湖北省',
    summary: '对连片种植水稻面积达50亩以上的经营主体给予补贴...',
    image: '/images/policy/planting1.jpg'
  },
  {
    id: 2,
    type: 'machinery',
    title: '农机购置方案',
    date: '2023-08-15',
    region: '湖南省',
    summary: '对购置指定农机具给予30%价格补贴...',
    image: '/images/policy/machinery1.jpg'
  },
  {
    id: 3,
    type: 'animal',
    title: '畜牧养殖扶持',
    date: '2023-07-20',
    region: '江西省',
    summary: '新建标准化养殖场最高补贴50万元...',
    image: '/images/policy/animal1.jpg'
  },
  {
    id: 4,
    type: 'industry',
    title: '产业振兴计划',
    date: '2023-06-10',
    region: '安徽省',
    summary: '重点支持农业产业化龙头企业发展...',
    image: '/images/policy/industry1.jpg'
  }
];

module.exports = {
  getPolicies: (type, page=1, pageSize=10) => {
    const data = type ? LOCAL_POLICIES[type] : Object.values(LOCAL_POLICIES).flat()
    const start = (page-1)*pageSize
    return {
      data: data.slice(start, start+pageSize),
      total: data.length
    }
  }
} 