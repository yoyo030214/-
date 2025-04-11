const db = require('../models');
const { Product, Category, ProductImage } = db;
const SeasonalUtil = require('../utils/seasonalUtil');

class ProductController {
  /**
   * 获取产品列表
   */
  async getProducts(req, res) {
    try {
      const { page = 1, limit = 10, category, season } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (category && category !== 'all') {
        where.category_id = category;
      }
      
      // 添加季节筛选
      if (season && season !== 'all') {
        where.seasons = {
          [db.Sequelize.Op.contains]: [season]
        };
      }

      const { rows: products, count } = await Product.findAndCountAll({
        where,
        include: [
          { model: Category },
          { model: ProductImage }
        ],
        offset,
        limit,
        order: [['created_at', 'DESC']]
      });

      // 处理产品数据，添加季节信息
      const processedProducts = products.map(product => {
        const data = product.toJSON();
        return {
          ...data,
          seasonalTags: SeasonalUtil.getSeasonalTags(data),
          isInSeason: SeasonalUtil.isInSeason(data)
        };
      });

      res.json({
        success: true,
        data: {
          products: processedProducts,
          total: count,
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('获取产品列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品列表失败'
      });
    }
  }

  /**
   * 获取地图产品数据
   */
  async getMapProducts(req, res) {
    try {
      const { longitude, latitude, filter = 'all', season = 'all', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (filter !== 'all') {
        where.category = filter;
      }
      
      // 添加季节筛选
      if (season !== 'all') {
        where.seasons = {
          [db.Sequelize.Op.contains]: [season]
        };
      }

      const { rows: products, count } = await Product.findAndCountAll({
        where,
        include: [
          { model: Category },
          { model: ProductImage }
        ],
        offset,
        limit
      });

      // 处理产品数据，添加季节信息和距离计算
      const processedProducts = products.map(product => {
        const data = product.toJSON();
        return {
          ...data,
          seasonalTags: SeasonalUtil.getSeasonalTags(data),
          isInSeason: SeasonalUtil.isInSeason(data),
          distance: this.calculateDistance(
            latitude, 
            longitude, 
            data.latitude, 
            data.longitude
          )
        };
      });

      // 按距离排序
      processedProducts.sort((a, b) => a.distance - b.distance);

      res.json({
        success: true,
        data: processedProducts,
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });
    } catch (error) {
      console.error('获取地图产品数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取地图产品数据失败'
      });
    }
  }

  /**
   * 获取产品详情
   */
  async getProductDetail(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id, {
        include: [
          { model: Category },
          { model: ProductImage }
        ]
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '产品不存在'
        });
      }

      // 处理产品数据，添加季节信息
      const data = product.toJSON();
      const processedProduct = {
        ...data,
        seasonalTags: SeasonalUtil.getSeasonalTags(data),
        isInSeason: SeasonalUtil.isInSeason(data)
      };

      res.json({
        success: true,
        data: processedProduct
      });
    } catch (error) {
      console.error('获取产品详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取产品详情失败'
      });
    }
  }

  /**
   * 获取推荐产品
   */
  async getRecommendedProducts(req, res) {
    try {
      const products = await Product.findAll({
        include: [
          { model: Category },
          { model: ProductImage }
        ],
        limit: 10
      });

      // 处理产品数据，添加季节信息
      const processedProducts = products.map(product => {
        const data = product.toJSON();
        return {
          ...data,
          seasonalTags: SeasonalUtil.getSeasonalTags(data),
          isInSeason: SeasonalUtil.isInSeason(data)
        };
      });

      // 获取下一个节气的推荐产品
      const nextTermRecommendations = SeasonalUtil.getNextTermRecommendations(processedProducts);

      res.json({
        success: true,
        data: {
          currentTerm: SeasonalUtil.getCurrentTerm(),
          recommendations: nextTermRecommendations
        }
      });
    } catch (error) {
      console.error('获取推荐产品失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐产品失败'
      });
    }
  }

  /**
   * 计算两点之间的距离（米）
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 角度转弧度
   */
  toRad(degree) {
    return degree * Math.PI / 180;
  }
}

module.exports = new ProductController(); 