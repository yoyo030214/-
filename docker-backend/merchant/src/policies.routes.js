const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('./middlewares/authMiddleware');
const { fetchPolicies } = require('./utils/policyFetcher');

// 简单的政策API - 使用内存数据
const policies = [
  { 
    id: 1, 
    title: '农业补贴政策', 
    content: '2024年农业补贴政策详情...\n\n各地区农民可以申请多种补贴：\n1. 种粮农民一次性补贴\n2. 农机购置补贴\n3. 耕地地力保护补贴\n\n申请方式：登录地方农业农村部门网站或到当地农业服务中心申请。', 
    publishDate: '2024-01-15',
    source: '农业农村部',
    category: '补贴',
    status: 'active'
  },
  { 
    id: 2, 
    title: '农产品市场保障措施', 
    content: '关于保障农产品市场稳定的政策...\n\n为保障农产品市场稳定，国家推出以下措施：\n1. 建立健全农产品价格保险制度\n2. 加强农产品供需监测与预警\n3. 完善农产品收储制度\n4. 促进农产品产销对接\n\n联系方式：农业农村部市场与信息化司 010-XXXXXXXX', 
    publishDate: '2024-02-20',
    source: '市场监管总局',
    category: '市场',
    status: 'active'
  },
  {
    id: 3,
    title: '乡村振兴专项资金管理办法',
    content: '乡村振兴专项资金管理办法详情...\n\n专项资金主要用于：\n1. 产业发展\n2. 人才培养\n3. 生态保护\n4. 农村基础设施建设\n\n申报流程：\n县级部门申报 → 市级审核 → 省级审批 → 资金下拨',
    publishDate: '2024-03-10',
    source: '财政部',
    category: '资金',
    status: 'active'
  },
  {
    id: 4,
    title: '农业绿色发展技术导则',
    content: '农业绿色发展技术导则...\n\n主要技术方向：\n1. 节水农业技术\n2. 化肥农药减量增效技术\n3. 农业废弃物资源化利用技术\n4. 农业清洁生产技术\n\n各地可结合实际情况选择适合的技术路线。',
    publishDate: '2024-03-25',
    source: '农业农村部',
    category: '技术',
    status: 'active'
  },
  {
    id: 5,
    title: '数字乡村建设指南',
    content: '数字乡村建设指南...\n\n重点建设内容：\n1. 农村信息基础设施建设\n2. 农业农村大数据平台建设\n3. 智慧农业示范工程\n4. 农村电商体系建设\n\n到2025年，力争实现村村通宽带、户户用互联网。',
    publishDate: '2024-04-01',
    source: '工信部',
    category: '其他',
    status: 'active'
  }
];

// 获取政策统计数据
router.get('/policies/stats', (req, res) => {
  try {
    const activePolicies = policies.filter(p => p.status === 'active');
    
    // 按分类统计
    const categoryStats = {};
    activePolicies.forEach(policy => {
      if (!categoryStats[policy.category]) {
        categoryStats[policy.category] = 0;
      }
      categoryStats[policy.category]++;
    });
    
    // 按来源统计
    const sourceStats = {};
    activePolicies.forEach(policy => {
      if (!sourceStats[policy.source]) {
        sourceStats[policy.source] = 0;
      }
      sourceStats[policy.source]++;
    });
    
    // 最新政策
    const latestPolicies = [...activePolicies]
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 3);
    
    res.json({
      success: true,
      data: {
        totalPolicies: activePolicies.length,
        categoryStats,
        sourceStats,
        latestPolicies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取政策统计数据失败'
    });
  }
});

// 获取最新政策
router.get('/policies/latest', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    
    const latestPolicies = [...policies]
      .filter(p => p.status === 'active')
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, count);
    
    res.json({
      success: true,
      data: latestPolicies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取最新政策失败'
    });
  }
});

// 获取政策列表
router.get('/policies', (req, res) => {
  try {
    const { category, search } = req.query;
    
    let filteredPolicies = [...policies];
    
    // 分类过滤
    if (category) {
      filteredPolicies = filteredPolicies.filter(p => p.category === category);
    }
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPolicies = filteredPolicies.filter(p => 
        p.title.toLowerCase().includes(searchLower) || 
        p.content.toLowerCase().includes(searchLower)
      );
    }
    
    // 只返回状态为active的政策
    filteredPolicies = filteredPolicies.filter(p => p.status === 'active');
    
    res.json({
      success: true,
      data: filteredPolicies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取政策列表失败'
    });
  }
});

// 获取政策详情
router.get('/policies/:id', (req, res) => {
  const policy = policies.find(p => p.id === parseInt(req.params.id));
  
  if (!policy) {
    return res.status(404).json({
      success: false,
      message: '政策不存在'
    });
  }
  
  res.json({
    success: true,
    data: policy
  });
});

// 抓取最新政策（需要管理员权限）
router.post('/policies/fetch', verifyToken, isAdmin, async (req, res) => {
  try {
    console.log('开始抓取最新政策...');
    const newPolicies = await fetchPolicies();
    
    if (newPolicies && newPolicies.length > 0) {
      // 添加到现有政策中，注意更新ID
      const maxId = policies.length > 0 ? Math.max(...policies.map(p => p.id)) : 0;
      
      newPolicies.forEach((policy, index) => {
        // 检查是否已存在相同标题的政策
        const exists = policies.some(p => p.title === policy.title);
        if (!exists) {
          policies.push({
            ...policy,
            id: maxId + index + 1
          });
        }
      });
      
      res.json({
        success: true,
        message: `成功抓取了 ${newPolicies.length} 条政策，添加了 ${newPolicies.filter(p => !policies.some(ex => ex.title === p.title)).length} 条新政策`
      });
    } else {
      res.json({
        success: true,
        message: '没有找到新的政策'
      });
    }
  } catch (error) {
    console.error('抓取政策失败:', error);
    res.status(500).json({
      success: false,
      message: '抓取政策失败: ' + (error.message || '未知错误')
    });
  }
});

// 以下路由需要管理员权限
// 添加政策
router.post('/policies', verifyToken, isAdmin, (req, res) => {
  try {
    const { title, content, source, category, publishDate } = req.body;
    
    // 基本验证
    if (!title || !content || !source || !category) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、来源和分类不能为空'
      });
    }
    
    const newPolicy = {
      id: policies.length > 0 ? Math.max(...policies.map(p => p.id)) + 1 : 1,
      title,
      content,
      source,
      category,
      status: 'active',
      publishDate: publishDate || new Date().toISOString().split('T')[0]
    };
    
    policies.push(newPolicy);
    
    res.status(201).json({
      success: true,
      message: '政策添加成功',
      data: newPolicy
    });
  } catch (error) {
    console.error('添加政策失败:', error);
    res.status(500).json({
      success: false,
      message: '添加政策失败: ' + (error.message || '未知错误')
    });
  }
});

// 更新政策
router.put('/policies/:id', verifyToken, isAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = policies.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '政策不存在'
      });
    }
    
    // 基本验证
    const { title, content, source, category, status } = req.body;
    if (!title || !content || !source || !category) {
      return res.status(400).json({
        success: false,
        message: '标题、内容、来源和分类不能为空'
      });
    }
    
    policies[index] = {
      ...policies[index],
      ...req.body,
      id // 确保ID不变
    };
    
    res.json({
      success: true,
      message: '政策更新成功',
      data: policies[index]
    });
  } catch (error) {
    console.error('更新政策失败:', error);
    res.status(500).json({
      success: false,
      message: '更新政策失败: ' + (error.message || '未知错误')
    });
  }
});

// 删除政策
router.delete('/policies/:id', verifyToken, isAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = policies.findIndex(p => p.id === id);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '政策不存在'
      });
    }
    
    // 软删除
    policies[index].status = 'inactive';
    
    res.json({
      success: true,
      message: '政策删除成功'
    });
  } catch (error) {
    console.error('删除政策失败:', error);
    res.status(500).json({
      success: false,
      message: '删除政策失败: ' + (error.message || '未知错误')
    });
  }
});

// 测试路由
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: '政策服务运行正常',
    time: new Date().toISOString()
  });
});

// 正确导出
module.exports = { router, policies }; 