const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');

// 政策来源配置
const POLICY_SOURCES = {
  MOA: {
    name: '农业农村部',
    baseUrl: 'http://www.moa.gov.cn',
    listUrl: 'http://www.moa.gov.cn/govpublic/ZCYS/index.htm',
    encoding: 'utf-8',
    selector: {
      list: '.pub-media1',
      title: 'a',
      date: '.date',
      link: 'a'
    }
  },
  LOCAL: {
    name: '地方农业政策',
    baseUrl: 'http://www.farmer.com.cn',
    listUrl: 'http://www.farmer.com.cn/zcfg/',
    encoding: 'gbk',
    selector: {
      list: '.news_list li',
      title: 'a',
      date: 'span',
      link: 'a'
    }
  }
};

class PolicyCrawler {
  constructor() {
    this.sources = POLICY_SOURCES;
  }

  // 获取页面内容
  async fetchPage(url, encoding = 'utf-8') {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const data = response.data.toString(encoding);
      return data;
    } catch (error) {
      console.error(`抓取页面失败: ${url}`, error);
      return null;
    }
  }

  // 解析政策列表
  parsePolicyList(html, source) {
    const $ = cheerio.load(html);
    const policies = [];

    $(source.selector.list).each((index, element) => {
      const title = $(element).find(source.selector.title).text().trim();
      const date = $(element).find(source.selector.date).text().trim();
      const link = $(element).find(source.selector.link).attr('href');
      
      if (title && date) {
        policies.push({
          title,
          date: this.formatDate(date),
          link: this.formatLink(link, source.baseUrl),
          source: source.name
        });
      }
    });

    return policies;
  }

  // 解析政策详情
  async parsePolicyDetail(url, encoding) {
    const html = await this.fetchPage(url, encoding);
    if (!html) return null;

    const $ = cheerio.load(html);
    
    // 提取正文内容
    const content = $('.TRS_Editor, .article-content').text().trim();
    
    // 提取关键信息
    const summary = content.substring(0, 200) + '...';
    const type = this.classifyPolicyType(content);
    
    return {
      content,
      summary,
      type
    };
  }

  // 格式化日期
  formatDate(dateStr) {
    try {
      const date = new Date(dateStr.replace(/[年月]/g, '-').replace('日', ''));
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateStr;
    }
  }

  // 格式化链接
  formatLink(link, baseUrl) {
    if (!link) return '';
    return link.startsWith('http') ? link : `${baseUrl}${link}`;
  }

  // 分类政策类型
  classifyPolicyType(content) {
    const typePatterns = {
      planting: ['种植', '农作物', '粮食'],
      machinery: ['农机', '机械化', '设备'],
      animal: ['畜牧', '养殖', '渔业'],
      industry: ['产业', '农业产业化', '龙头企业'],
      land: ['耕地', '土地', '农田'],
      green: ['绿色', '有机', '生态']
    };

    for (const [type, keywords] of Object.entries(typePatterns)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return type;
      }
    }
    
    return 'other';
  }

  // 执行抓取
  async crawl() {
    const results = [];

    for (const source of Object.values(this.sources)) {
      try {
        console.log(`开始抓取: ${source.name}`);
        
        // 获取列表页
        const listHtml = await this.fetchPage(source.listUrl, source.encoding);
        if (!listHtml) continue;

        // 解析政策列表
        const policies = this.parsePolicyList(listHtml, source);
        
        // 获取详情
        for (const policy of policies) {
          const detail = await this.parsePolicyDetail(policy.link, source.encoding);
          if (detail) {
            results.push({
              ...policy,
              ...detail
            });
          }
        }

        console.log(`成功抓取 ${policies.length} 条政策 从 ${source.name}`);
      } catch (error) {
        console.error(`抓取失败: ${source.name}`, error);
      }
    }

    return results;
  }
}

module.exports = PolicyCrawler; 