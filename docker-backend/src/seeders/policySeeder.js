const { Policy } = require('../models');

const policies = [
  {
    title: '农业补贴政策',
    summary: '对符合条件的农户提供资金补贴，支持农业生产',
    content: '根据最新的农业补贴政策，符合条件的农户每亩可获得XXX元补贴。申请条件包括：\n1. 拥有合法的土地使用权\n2. 土地用于农业生产\n3. 按规定进行种植登记\n\n申请流程：\n1. 向所在村委会提出申请\n2. 填写补贴申请表\n3. 提交相关证明材料\n4. 等待审核通过后发放补贴\n\n补贴标准：\n- 粮食作物：每亩XXX元\n- 经济作物：每亩XXX元\n- 设施农业：每亩XXX元',
    category: '补贴政策',
    publishDate: '2025-03-01',
    source: '农业农村部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/subsidy',
    attachments: JSON.stringify([
      {
        name: '申请表格.docx',
        url: 'http://www.example.com/files/application_form.docx'
      },
      {
        name: '政策全文.pdf',
        url: 'http://www.example.com/files/policy_full.pdf'
      }
    ]),
    isActive: true,
    viewCount: 120
  },
  {
    title: '农业科技创新支持计划',
    summary: '支持农业科技创新，促进农业现代化发展',
    content: '为促进农业科技创新，政府将提供一系列支持措施，包括资金补助、技术培训等。\n\n支持方向：\n1. 农业生物技术研发\n2. 智能农业装备研发与应用\n3. 农业物联网技术应用\n4. 种质资源保护与利用\n5. 绿色农业技术推广\n\n支持方式：\n1. 科研项目资金支持：单个项目最高资助XXX万元\n2. 技术培训：免费提供技术培训和指导\n3. 设备补贴：购买相关设备可获得30%的补贴\n\n申请条件：\n1. 具有独立法人资格的科研机构、高校或企业\n2. 拥有相关领域的研究基础和团队\n3. 项目具有创新性和实用价值',
    category: '科技支持',
    publishDate: '2025-02-15',
    source: '科技部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/tech-innovation',
    attachments: JSON.stringify([
      {
        name: '申请指南.pdf',
        url: 'http://www.example.com/files/application_guide.pdf'
      },
      {
        name: '项目书模板.docx',
        url: 'http://www.example.com/files/project_template.docx'
      }
    ]),
    isActive: true,
    viewCount: 85
  },
  {
    title: '有机农业认证补贴政策',
    summary: '鼓励发展有机农业，提供认证补贴',
    content: '对获得有机农业认证的农产品生产企业和个人，提供认证费用50%的补贴。\n\n补贴对象：\n1. 获得有机农业认证的种植业、养殖业企业或个人\n2. 符合国家有机农业标准的生产者\n\n申请材料：\n1. 有机农业认证证书\n2. 认证费用发票\n3. 企业或个人身份证明\n4. 生产场地证明\n\n补贴上限：每个认证主体最高补贴10万元。',
    category: '有机农业',
    publishDate: '2025-01-20',
    source: '农业农村部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/organic-subsidy',
    attachments: JSON.stringify([
      {
        name: '有机认证流程.pdf',
        url: 'http://www.example.com/files/organic_certification.pdf'
      }
    ]),
    isActive: true,
    viewCount: 65
  },
  {
    title: '农村电商发展扶持政策',
    summary: '促进农村电商发展，拓宽农产品销售渠道',
    content: '为促进农村电商发展，将提供场地支持、税收优惠、培训服务等一系列扶持措施。\n\n扶持内容：\n1. 电商创业补贴：每个创业主体最高补贴5万元\n2. 电商培训：免费提供电商运营、网店装修等培训\n3. 物流补贴：农产品物流费用补贴20%\n4. 品牌建设：支持农产品品牌创建和推广\n\n申请条件：\n1. 注册地在农村地区的电商企业或个体工商户\n2. 主要经营本地农产品的电商平台\n3. 年销售额达到一定规模',
    category: '电商政策',
    publishDate: '2024-12-10',
    source: '商务部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/ecommerce',
    attachments: JSON.stringify([
      {
        name: '电商补贴申请表.docx',
        url: 'http://www.example.com/files/ecommerce_application.docx'
      }
    ]),
    isActive: true,
    viewCount: 110
  },
  {
    title: '设施农业建设支持政策',
    summary: '支持设施农业建设，提高农业生产效率',
    content: '对新建设施农业项目，包括智能温室、水肥一体化系统等，提供30%的建设补贴。\n\n支持范围：\n1. 智能温室大棚建设\n2. 水肥一体化系统\n3. 智能控制系统\n4. 节能环保设施\n\n申请条件：\n1. 设施农业项目投资额达到50万元以上\n2. 项目建设符合当地农业发展规划\n3. 项目建设使用环保材料和技术\n\n补贴方式：\n建设完成并验收合格后，按照实际投资额的30%给予补贴，单个项目最高补贴不超过100万元。',
    category: '设施农业',
    publishDate: '2024-11-25',
    source: '农业农村部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/facility',
    attachments: JSON.stringify([
      {
        name: '设施农业建设指南.pdf',
        url: 'http://www.example.com/files/facility_guide.pdf'
      },
      {
        name: '补贴申请表.docx',
        url: 'http://www.example.com/files/subsidy_form.docx'
      }
    ]),
    isActive: true,
    viewCount: 95
  },
  {
    title: '农业保险补贴政策',
    summary: '提高农业抗风险能力，降低农户种植风险',
    content: '为提高农业抗风险能力，政府对农户参加农业保险给予一定比例的保费补贴。\n\n保险补贴对象：\n1. 种植业保险：水稻、小麦、玉米等主要粮食作物\n2. 养殖业保险：生猪、奶牛等主要畜禽品种\n3. 设施农业保险：温室大棚等农业设施\n\n补贴比例：\n1. 中央财政补贴：40%\n2. 省级财政补贴：30%\n3. 市县财政补贴：20%\n4. 农户自缴：10%\n\n参保流程：\n1. 向当地农业保险经办机构提出申请\n2. 填写保险申请表\n3. 缴纳自付部分保费\n4. 获得保险凭证',
    category: '农业保险',
    publishDate: '2024-10-15',
    source: '财政部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/insurance',
    attachments: JSON.stringify([
      {
        name: '农业保险介绍.pdf',
        url: 'http://www.example.com/files/insurance_intro.pdf'
      }
    ]),
    isActive: true,
    viewCount: 78
  },
  {
    title: '农村金融服务优惠政策',
    summary: '加强农村金融服务，支持农业农村发展',
    content: '为加强农村金融服务，支持农业农村发展，推出多项优惠政策。\n\n政策内容：\n1. 农业贷款贴息：对农户、农业企业的生产经营贷款给予2-3个百分点的利息补贴\n2. 信贷担保支持：设立农业信贷担保基金，为农户和小微企业提供担保服务\n3. 农村普惠金融：推广农村数字金融服务，降低农村地区金融服务门槛\n\n申请条件：\n1. 农业生产经营主体\n2. 信用记录良好\n3. 具有稳定的收入来源和还款能力',
    category: '农村金融',
    publishDate: '2024-09-20',
    source: '中国人民银行',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/finance',
    attachments: JSON.stringify([
      {
        name: '金融服务手册.pdf',
        url: 'http://www.example.com/files/finance_handbook.pdf'
      }
    ]),
    isActive: true,
    viewCount: 62
  },
  {
    title: '农产品品牌建设支持政策',
    summary: '支持农产品品牌创建和推广，提升农产品附加值',
    content: '为提高农产品附加值和市场竞争力，支持农产品品牌创建和推广。\n\n支持内容：\n1. 品牌创建补助：对创建国家级、省级农产品区域公用品牌和企业品牌的主体给予一次性奖励\n2. 认证补贴：对获得有机、绿色、地理标志等认证的农产品给予认证费用补贴\n3. 宣传推广：支持品牌农产品参加国内外展会，开展宣传推广活动\n\n申请条件：\n1. 具有独立法人资格的农业企业或农民合作社\n2. 产品质量符合国家相关标准\n3. 具有一定的生产规模和市场份额',
    category: '品牌建设',
    publishDate: '2024-08-15',
    source: '农业农村部',
    contactPhone: '010-XXXXXXXX',
    applicationUrl: 'http://www.example.com/brand',
    attachments: JSON.stringify([
      {
        name: '品牌建设指南.pdf',
        url: 'http://www.example.com/files/brand_guide.pdf'
      }
    ]),
    isActive: true,
    viewCount: 55
  }
];

// 创建种子数据函数
const seedPolicies = async () => {
  try {
    // 检查是否已存在政策数据
    const count = await Policy.count();
    if (count === 0) {
      // 如果没有数据，则批量创建
      await Policy.bulkCreate(policies);
      console.log('政策种子数据创建成功！');
    } else {
      console.log(`政策表中已有${count}条数据，跳过种子数据创建。`);
    }
  } catch (error) {
    console.error('创建政策种子数据失败:', error);
  }
};

module.exports = seedPolicies; 