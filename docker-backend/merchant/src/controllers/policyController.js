const PolicyService = require('../services/policyService');

class PolicyController {
  static async fetchPolicies(req, res) {
    try {
      const result = await PolicyService.fetchPolicies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: '政策抓取失败', error: error.message });
    }
  }

  static async getAllPolicies(req, res) {
    try {
      const policies = await PolicyService.getAllPolicies();
      res.json({
        success: true,
        data: policies
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取政策列表失败', error: error.message });
    }
  }

  static async getPolicyById(req, res) {
    try {
      const { id } = req.params;
      const policy = await PolicyService.getPolicyById(id);
      
      if (!policy) {
        return res.status(404).json({ success: false, message: '政策不存在' });
      }
      
      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '获取政策详情失败', error: error.message });
    }
  }

  static async updatePolicy(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const policy = await PolicyService.updatePolicy(id, updateData);
      
      res.json({
        success: true,
        message: '政策更新成功',
        data: policy
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '更新政策失败', error: error.message });
    }
  }

  static async deletePolicy(req, res) {
    try {
      const { id } = req.params;
      const { permanent } = req.query; // 是否永久删除
      
      const result = permanent 
        ? await PolicyService.hardDeletePolicy(id)
        : await PolicyService.deletePolicy(id);
      
      res.json({
        success: true,
        message: permanent ? '政策永久删除成功' : '政策删除成功'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: '删除政策失败', error: error.message });
    }
  }
}

module.exports = PolicyController; 