const axios = require('axios');
const { Policy } = require('../models');

class PolicyService {
  static async fetchPolicies() {
    try {
      // 这里替换为实际的政策API地址
      const response = await axios.get('https://api.example.com/agricultural-policies');
      const policies = response.data;

      for (const policyData of policies) {
        await Policy.create({
          title: policyData.title,
          content: policyData.content,
          publishDate: policyData.publishDate,
          source: policyData.source,
          category: policyData.category,
          status: 'active'
        });
      }

      return { success: true, message: '政策抓取成功' };
    } catch (error) {
      console.error('政策抓取失败:', error);
      return { success: false, message: '政策抓取失败' };
    }
  }

  static async getAllPolicies() {
    try {
      const policies = await Policy.findAll({
        where: { status: 'active' },
        order: [['publishDate', 'DESC']]
      });
      return policies;
    } catch (error) {
      console.error('获取政策列表失败:', error);
      throw error;
    }
  }

  static async getPolicyById(id) {
    try {
      const policy = await Policy.findByPk(id);
      return policy;
    } catch (error) {
      console.error('获取政策详情失败:', error);
      throw error;
    }
  }

  static async updatePolicy(id, updateData) {
    try {
      const policy = await Policy.findByPk(id);
      
      if (!policy) {
        throw new Error('政策不存在');
      }
      
      await policy.update(updateData);
      return policy;
    } catch (error) {
      console.error('更新政策失败:', error);
      throw error;
    }
  }

  static async deletePolicy(id) {
    try {
      const policy = await Policy.findByPk(id);
      
      if (!policy) {
        throw new Error('政策不存在');
      }
      
      await policy.update({ status: 'inactive' });
      return { success: true };
    } catch (error) {
      console.error('删除政策失败:', error);
      throw error;
    }
  }
  
  static async hardDeletePolicy(id) {
    try {
      const policy = await Policy.findByPk(id);
      
      if (!policy) {
        throw new Error('政策不存在');
      }
      
      await policy.destroy();
      return { success: true };
    } catch (error) {
      console.error('永久删除政策失败:', error);
      throw error;
    }
  }
}

module.exports = PolicyService; 