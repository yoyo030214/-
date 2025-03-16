/**
 * 小程序优化配置
 * 用于管理小程序的各种优化参数
 */

module.exports = {
  /**
   * 是否在生产环境删除console.log
   * 建议: 生产环境设为true，开发环境设为false
   */
  removeConsoleInProd: true,
  
  /**
   * 图片压缩质量 (1-100)
   * 建议值: 60-80
   * 值越低，体积越小，但图片质量会下降
   */
  imageQuality: 70,
  
  /**
   * 需要使用CDN的大型图片
   * 在这里列出的图片会被替换为CDN URL
   * 使用方法: 将图片上传到CDN后，在这里配置
   */
  cdnImages: {
    // 示例: 'images/banner.jpg': 'https://cdn.example.com/banner.jpg',
    // 添加需要使用CDN的图片路径
  },
  
  /**
   * 是否使用WebP格式
   * WebP格式通常比JPG和PNG小30-70%
   * 注意: 部分低版本系统可能不支持WebP
   */
  useWebP: true,
  
  /**
   * 是否启用自动分包加载
   * 如果设为true，会自动分析并提示分包建议
   */
  autoSubpackage: true,
  
  /**
   * 需要忽略的文件和目录
   * 这些文件不会被打包到小程序中
   */
  ignorePatterns: [
    'node_modules/**',
    '**/*.md',
    '.git/**',
    '.github/**',
    'docs/**',
    'tests/**',
    '.DS_Store'
  ],
  
  /**
   * 设置请求域名白名单
   * 需要与微信小程序管理后台的配置一致
   */
  requestDomains: [
    // 'api.example.com'
  ],
  
  /**
   * 预加载规则
   * 配置哪些页面需要预加载
   */
  preloadRules: {
    'pages/index/index': {
      network: 'all',
      packages: ['subpackages/common']
    }
  }
}; 