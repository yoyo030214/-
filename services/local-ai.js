// 本地智能问答数据
const faqData = [
  {
    question: '如何使用语音助手？',
    answer: '您可以点击语音按钮，对着手机说话，系统会自动识别您的问题并回答。连续对话模式下，无需每次按住按钮。'
  },
  {
    question: '如何浏览农产品？',
    answer: '您可以在首页浏览推荐农产品，或通过\'本地特产\'、\'当季时令\'和\'农户直供\'分类查看特色农产品。也可以使用搜索功能直接查找感兴趣的产品。'
  },
  {
    question: '如何查看当地天气？',
    answer: '在首页右上角有天气快捷入口，点击后可查看当地实时天气和未来7天预报，以及农业气象指导建议。'
  },
  {
    question: '如何联系客服？',
    answer: '您可以在\'我的\'-\'在线客服\'中联系我们，或在对话页面底部点击\'在线客服\'或\'电话客服\'按钮与人工客服联系。'
  },
  {
    question: '购买农产品怎么支付？',
    answer: '系统支持微信支付、支付宝、银行卡等多种支付方式，选择商品下单后，进入支付页面选择您喜欢的支付方式即可。'
  }
];

// 简单的问答匹配逻辑
function getAnswer(question) {
  // 如果问题为空，返回默认回答
  if (!question || question.trim() === '') {
    return '请问您想了解什么农业问题？可以询问农产品、天气、种植技术等相关信息。';
  }

  // 简单的关键词匹配
  for (const item of faqData) {
    if (question.includes(item.question) || 
        item.question.includes(question) || 
        hasCommonKeywords(question, item.question)) {
      return item.answer;
    }
  }

  // 默认回答
  return '对不起，我目前无法回答这个问题。您可以咨询更多关于农产品、种植技术、天气预报等问题，或联系人工客服获取帮助。';
}

// 检查两个字符串是否有共同关键词
function hasCommonKeywords(str1, str2) {
  // 提取中文关键词(去除常见虚词)
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);
  
  // 检查是否有交集
  return keywords1.some(word => keywords2.includes(word));
}

// 提取中文关键词(简化版)
function extractKeywords(text) {
  // 去除标点符号
  text = text.replace(/[，。？！、：；""]/g, '');
  
  // 去除常见虚词(简化版)
  const stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
  
  let words = [];
  for (let i = 0; i < text.length; i++) {
    // 简单切词，每个字符作为一个词(简化处理)
    const char = text[i];
    if (!stopWords.includes(char)) {
      words.push(char);
    }
  }
  
  return words;
}

module.exports = {
  getAnswer
}; 