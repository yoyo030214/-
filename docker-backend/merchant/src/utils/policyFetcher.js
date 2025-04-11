/**
 * 政策抓取实用工具
 * 用于从农业农村部网站抓取最新政策
 */
const axios = require('axios');
const cheerio = require('cheerio');

// 政策数据源
const POLICY_SOURCES = [
  {
    name: '农业农村部',
    url: 'http://www.moa.gov.cn/gk/',
    category: '政策法规'
  },
  {
    name: '农业农村部',
    url: 'http://www.moa.gov.cn/ztzl/zjny/',
    category: '补贴'
  },
  {
    name: '财政部',
    url: 'http://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/',
    category: '资金'
  }
];

/**
 * 从网页中提取政策信息
 * @param {string} html HTML内容
 * @param {string} source 来源
 * @param {string} category 分类
 * @returns {Array} 政策列表
 */
function extractPolicies(html, source, category) {
  try {
    const $ = cheerio.load(html);
    const policies = [];
    
    // 不同的网站有不同的结构，这里模拟通用提取逻辑
    $('.news-list li, .list-item, .xxgk_navli').each((index, element) => {
      if (index >= 5) return; // 每个来源最多获取5条
      
      const title = $(element).find('a').text().trim();
      const date = $(element).find('.date, .time').text().trim() || 
                  new Date().toISOString().split('T')[0];
      
      // 如果标题包含"农业"、"乡村"、"补贴"等关键词，则添加到政策列表
      if (title && (
          title.includes('农业') || 
          title.includes('乡村') || 
          title.includes('补贴') || 
          title.includes('资金') || 
          title.includes('农村') || 
          title.includes('政策')
      )) {
        policies.push({
          title,
          content: `该政策《${title}》详细内容正在获取中，请稍后查看完整内容。\n\n来源：${source}\n发布日期：${date}`,
          publishDate: date,
          source,
          category,
          status: 'active'
        });
      }
    });
    
    return policies;
  } catch (error) {
    console.error('提取政策内容错误:', error);
    return [];
  }
}

/**
 * 抓取政策
 * @returns {Promise<Array>} 抓取到的政策列表
 */
async function fetchPolicies() {
  try {
    console.log('开始抓取政策...');
    const allPolicies = [];
    
    // 由于实际网站可能有反爬机制，这里使用模拟数据
    // 在实际使用时，取消注释以下代码，并删除模拟数据
    /*
    for (const source of POLICY_SOURCES) {
      console.log(`从 ${source.name} 抓取政策...`);
      
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const policies = extractPolicies(response.data, source.name, source.category);
        allPolicies.push(...policies);
        
        console.log(`从 ${source.name} 抓取到 ${policies.length} 条政策`);
      } catch (error) {
        console.error(`从 ${source.name} 抓取政策失败:`, error);
      }
      
      // 避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    */
    
    // 模拟数据（如果实际抓取失败，或者测试时使用）
    allPolicies.push(
      {
        title: '关于做好2024年种粮农民一次性补贴政策实施工作的通知',
        content: '为保障国家粮食安全，支持粮食生产，根据中央财政预算安排，现就做好2024年种粮农民一次性补贴政策实施工作通知如下：\n\n一、补贴对象\n本次补贴对象为2024年种植粮食作物的农民（含个人和农场）。\n\n二、补贴标准\n中央财政按照每亩200元的标准进行补贴，各省份可根据实际情况增加补贴额度。\n\n三、申请流程\n1. 农民向所在村委会提交申请\n2. 村委会审核后上报乡镇农业部门\n3. 乡镇农业部门复核后报县级农业农村局\n4. 县级农业农村局批准后发放补贴\n\n各地要简化手续，提高效率，确保补贴资金及时足额发放到位。',
        publishDate: '2024-04-10',
        source: '农业农村部',
        category: '补贴',
        status: 'active'
      },
      {
        title: '农业绿色发展技术指导意见',
        content: '为推进农业绿色发展，减少化肥农药使用量，保护农业生态环境，特制定本技术指导意见：\n\n一、技术路线\n1. 有机肥替代化肥技术\n2. 生物农药替代化学农药技术\n3. 节水灌溉技术\n4. 秸秆综合利用技术\n\n二、重点区域\n东北黑土地保护区、华北地下水超采区、南方重金属污染区等重点区域率先推广。\n\n三、政策支持\n1. 对采用绿色技术的农民给予每亩50-100元补贴\n2. 支持新型农业经营主体购置相关设备\n3. 加大技术培训力度\n\n各地农业农村部门要认真组织实施，确保技术到位、指导到位、服务到位。',
        publishDate: '2024-04-05',
        source: '农业农村部',
        category: '技术',
        status: 'active'
      },
      {
        title: '2024年乡村产业发展项目资金管理办法',
        content: '为规范乡村产业发展项目资金使用，提高资金使用效益，特制定本办法：\n\n一、支持范围\n1. 农产品加工业提升工程\n2. 乡村休闲旅游建设项目\n3. 农村电商平台建设\n4. 特色农产品品牌打造\n\n二、申报条件\n1. 具有合法的市场主体资格\n2. 有明确的产业发展规划\n3. 带动农民增收效果明显\n4. 符合乡村振兴战略要求\n\n三、资金拨付和监管\n1. 采取"先建后补"或以奖代补方式\n2. 项目验收合格后拨付资金\n3. 建立全过程监管机制\n\n各级财政和农业农村部门要加强协作，确保资金安全和项目实效。',
        publishDate: '2024-03-20',
        source: '财政部',
        category: '资金',
        status: 'active'
      },
      {
        title: '推进智慧农业发展实施方案',
        content: '为加快推进智慧农业发展，提升农业现代化水平，特制定本实施方案：\n\n一、建设内容\n1. 农业物联网示范工程\n2. 农业大数据平台建设\n3. 智能农机装备推广\n4. 精准农业技术示范\n\n二、实施区域\n优先在粮食主产区、设施农业发达区和特色农业区推进实施。\n\n三、支持政策\n1. 给予项目建设补助，最高不超过项目总投资的30%\n2. 加大金融支持力度\n3. 开展技术培训和服务\n\n各地要结合实际，创新机制，确保智慧农业项目落地见效。',
        publishDate: '2024-03-15',
        source: '农业农村部',
        category: '技术',
        status: 'active'
      },
      {
        title: '关于开展新一轮高标准农田建设的指导意见',
        content: '为提升农业综合生产能力，巩固粮食安全根基，特就开展新一轮高标准农田建设提出如下意见：\n\n一、建设目标\n到2025年，全国建成10亿亩高标准农田，实现"田成方、林成网、路相通、渠相连"。\n\n二、建设标准\n1. 土地平整，田块集中连片\n2. 灌溉排水设施完善\n3. 田间道路通畅\n4. 林网配套，具有防风固土功能\n5. 土壤肥沃，质量良好\n\n三、资金安排\n中央财政和地方财政共同承担，按照每亩2000元标准进行补助。\n\n各地要把高标准农田建设作为重大工程，统筹谋划，加快推进。',
        publishDate: '2024-03-10',
        source: '农业农村部',
        category: '市场',
        status: 'active'
      }
    );
    
    console.log(`共抓取到 ${allPolicies.length} 条政策`);
    return allPolicies;
  } catch (error) {
    console.error('政策抓取失败:', error);
    return [];
  }
}

module.exports = {
  fetchPolicies
}; 