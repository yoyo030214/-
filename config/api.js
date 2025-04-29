module.exports = {
  baseUrl: 'https://your-api-domain.com', // 替换为实际的API域名
  endpoints: {
    weather: '/api/weather',
    orders: '/api/orders',
    address: '/api/address'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: 'sk-027edfd83447463b8ce69ce1c11759bd',
    model: 'deepseek-chat',
    fallbackModels: ['deepseek-llm', 'deepseek-coder'],
    endpoints: {
      chat: '/chat/completions'
    }
  }
}; 