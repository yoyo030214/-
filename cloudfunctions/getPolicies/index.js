const axios = require('axios');

exports.main = async (event, context) => {
  try {
    const { type, page = 1, pageSize = 20 } = event;
    const apiUrl = 'https://api.example.gov.cn/policies';
    
    const response = await axios.get(apiUrl, {
      params: {
        type,
        page,
        pageSize,
        appKey: 'YOUR_APP_KEY' // 申请政府开放平台的AppKey
      }
    });

    return {
      code: 200,
      data: response.data.map(item => ({
        id: item.policyId,
        title: item.policyTitle,
        type: item.policyType,
        summary: item.policyAbstract,
        publishDate: item.publishTime,
        region: item.regionName,
        tags: item.keywords.split(','),
        source: item.policySource,
        url: item.policyUrl
      }))
    };
  } catch (error) {
    console.error('API请求失败:', error);
    return {
      code: 500,
      message: '获取政策数据失败'
    };
  }
}; 