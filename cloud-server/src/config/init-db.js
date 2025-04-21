const { sequelize, User, Policy, FarmerStory, FarmerProduct } = require('../models');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    // 同步所有模型
    await sequelize.sync({ force: true });
    console.log('数据库表创建成功');

    // 创建测试用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    // 创建测试政策
    await Policy.create({
      title: '农业补贴政策',
      content: '农业补贴政策内容...',
      type: 'planting',
      status: 'published',
      publish_date: new Date(),
      effective_date: new Date(),
      view_count: 0
    });

    // 创建测试农产品
    await FarmerProduct.create({
      name: '有机蔬菜',
      description: '新鲜有机蔬菜',
      category: 'vegetables',
      sub_category: '叶菜类',
      price: 15.5,
      unit: '斤',
      stock: 100,
      status: 'available',
      origin: '本地农场',
      shelf_life: '7天',
      storage_method: '冷藏保存'
    });

    // 创建测试农户故事
    await FarmerStory.create({
      title: '有机蔬菜种植经验分享',
      content: '种植经验分享内容...',
      type: 'experience',
      status: 'published',
      view_count: 0
    });

    console.log('测试数据创建成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

module.exports = initializeDatabase; 