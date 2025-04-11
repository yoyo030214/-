module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '商品ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '商品数量'
    },
    selected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否选中'
    }
  }, {
    tableName: 'carts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'productId']
      }
    ]
  });

  Cart.associate = (models) => {
    Cart.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    Cart.belongsTo(models.Product, {
      foreignKey: 'productId',
      as: 'product'
    });
  };

  return Cart;
}; 