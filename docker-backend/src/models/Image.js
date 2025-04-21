const { DataTypes } = require('sequelize');
const sequelize = require('../../database/src/config/database');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名'
  },
  originalname: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '原始文件名'
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件路径'
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '文件类型'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文件大小(字节)'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '图片分类(产品、政策、用户头像等)'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联ID(产品ID、政策ID等)'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '上传者用户ID'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否公开可访问'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'images',
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['relatedId']
    },
    {
      fields: ['uploadedBy']
    }
  ]
});

module.exports = Image; 