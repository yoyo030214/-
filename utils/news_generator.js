const REGIONS = ['湖北', '湖南', '江西', '安徽', '河南', '山东', '江苏', '浙江'];
const CROPS = ['水稻', '小麦', '玉米', '茶叶', '棉花', '油菜', '柑橘', '生猪'];
const TAGS = ['种植技术', '市场行情', '政策解读', '病虫害防治', '新品种', '农业机械', '气象预警', '专家访谈'];
const CONTENT_TEMPLATES = [
  '{{region}}农业农村厅近日发布{{crop}}{{tag}}指导方案，主要内容包括...',
  '{{region}}省{{crop}}价格近期呈现{{trend}}趋势，专家分析认为...',
  '{{region}}省召开{{crop}}{{tag}}专题研讨会，重点讨论了...',
  '针对近期{{crop}}{{tag}}问题，{{region}}农业部门推出新措施...'
];

function generateNews() {
  return Array.from({length: 100}, (_, i) => {
    const region = REGIONS[i % REGIONS.length];
    const crop = CROPS[i % CROPS.length];
    const tag = TAGS[i % TAGS.length];
    const template = CONTENT_TEMPLATES[i % CONTENT_TEMPLATES.length];
    
    // 生成动态内容
    const content = template
      .replace(/{{region}}/g, region)
      .replace(/{{crop}}/g, crop)
      .replace(/{{tag}}/g, tag)
      .replace(/{{trend}}/g, ['上涨', '下跌', '平稳'][i % 3]);

    return {
      id: i + 1,
      title: `${region}省${crop}${tag}最新动态`,
      content,
      date: new Date(2023, i%12, (i%28)+1).toISOString().split('T')[0],
      region,
      tags: [crop, tag],
      views: Math.floor(Math.random() * 1000) + 100,
      source: `${region}农业农村厅`,
      images: [
        `/images/news/${crop}-${(i%5)+1}.jpg`,
        `/images/news/general-${(i%3)+1}.jpg`
      ]
    }
  });
}

module.exports = { generateNews }; 