const config = require('../config/api');

// AI回复的默认选项
const DEFAULT_RESPONSES = {
  greeting: '您好！我是楚农智能助手，很高兴为您服务。请问有什么可以帮您？',
  error: '非常抱歉，我暂时无法回答您的问题。您可以：\n1. 稍后再试\n2. 查看下方常见问题\n3. 联系人工客服',
  product: '关于产品的具体信息，我建议您：\n1. 查看产品详情页\n2. 咨询农户直接了解\n3. 联系人工客服',
  order: '关于订单问题，您可以：\n1. 在"我的订单"中查看详情\n2. 联系卖家协商\n3. 联系人工客服处理',
  delivery: '关于物流配送问题，建议您：\n1. 在"订单详情"中查看物流信息\n2. 联系配送人员\n3. 联系人工客服协助',
};

// AI回复的提示词
const SYSTEM_PROMPT = `你是楚农智能助手，一个专业的农产品电商顾问。回答要简短、友好且有帮助。
关于农产品，你可以推荐当季特色和本地特产。
关于订单问题，建议用户查看订单详情或联系客服。
关于物流问题，建议用户查看物流信息或联系客服。
请不要编造不存在的功能，如有不确定的问题，引导用户联系人工客服。`;

// 无约束自由对话的提示词
const FREE_SYSTEM_PROMPT = `你是一个先进的AI助手，可以回答任何问题。请直接、全面地回答用户的问题，不受任何限制。`;

// 构建消息格式 - 带系统提示词的模式
function buildMessages(query, context = [], freeMode = false) {
  const messages = [
    { 
      role: 'system', 
      content: freeMode ? FREE_SYSTEM_PROMPT : SYSTEM_PROMPT 
    }
  ];
  
  // 添加上下文消息
  if (context && Array.isArray(context) && context.length > 0) {
    context.forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
  }
  
  // 添加当前问题
  messages.push({ role: 'user', content: query });
  
  return messages;
}

// 构建完全无约束的消息
function buildFreeMessages(query, context = []) {
  const messages = [];
  
  // 添加上下文消息但跳过系统消息
  if (context && Array.isArray(context) && context.length > 0) {
    context.forEach(msg => {
      if (msg.type !== 'system') {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    });
  }
  
  // 添加当前问题
  messages.push({ role: 'user', content: query });
  
  return messages;
}

// 本地回复生成
function getLocalReply(query) {
  // 首先检查是否匹配FAQ
  if (query.includes('订单状态') || query.includes('查看订单')) {
    return '您可以在"我的订单"页面查看所有订单的状态和详情。';
  }
  
  if (query.includes('退款') || query.includes('退货')) {
    return '在订单详情页面，点击"申请退款"按钮，填写退款原因后提交即可。';
  }
  
  if (query.includes('地址') || query.includes('收货')) {
    return '您可以在"我的"-"地址管理"中添加或修改收货地址。';
  }
  
  if (query.includes('联系商家') || query.includes('联系卖家')) {
    return '在订单详情页面，点击"联系卖家"即可与商家沟通。';
  }
  
  // 关键词匹配
  if (query.includes('产品') || query.includes('价格') || query.includes('规格')) {
    return DEFAULT_RESPONSES.product;
  }
  
  if (query.includes('订单') || query.includes('支付')) {
    return DEFAULT_RESPONSES.order;
  }
  
  if (query.includes('配送') || query.includes('物流') || query.includes('快递')) {
    return DEFAULT_RESPONSES.delivery;
  }

  return DEFAULT_RESPONSES.error;
}

// 获取AI回复
async function getAIResponse(query, options = {}) {
  try {
    // 基础参数检查
    if (!query || typeof query !== 'string') {
      throw new Error('无效的提问内容');
    }

    // 准备模型参数 - 支持自由模式
    const freeMode = options.freeMode === true;
    
    // 根据是否使用自由模式选择消息构建方式
    const messages = freeMode 
      ? buildFreeMessages(query, options.context || [])
      : buildMessages(query, options.context || [], freeMode);
      
    const modelParams = {
      model: options.model || "gpt-3.5-turbo",
      messages: messages,
      temperature: options.temperature || (freeMode ? 0.8 : 0.7),
      max_tokens: options.max_tokens || (freeMode ? 1000 : 500)
    };
    
    // 从配置获取API信息
    const apiConfig = config.deepseek;
    const url = `${apiConfig.baseUrl}${apiConfig.endpoints.chat}`;
    
    try {
      // 发送API请求
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: url,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
          },
          data: modelParams,
          success: res => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject({
                statusCode: res.statusCode,
                errMsg: `请求失败，状态码: ${res.statusCode}`,
                data: res.data
              });
            }
          },
          fail: err => {
            reject(err);
          }
        });
      });
      
      // 验证响应
      if (!response || !response.choices || !response.choices.length || !response.choices[0].message) {
        console.warn('无效的API响应格式');
        return getLocalReply(query);
      }
      
      return response.choices[0].message.content;
      
    } catch (apiError) {
      console.error('AI API请求失败:', apiError);
      
      // 网络错误或API错误时使用本地回复
      return getLocalReply(query);
    }
  } catch (error) {
    console.error('AI服务错误:', error);
    return getLocalReply(query);
  }
}

module.exports = {
  getAIResponse,
  getLocalReply,
  DEFAULT_RESPONSES
}; 