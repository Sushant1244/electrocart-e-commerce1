module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    productId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    sessionId: { type: DataTypes.STRING, allowNull: true },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    meta: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'cart_items',
    timestamps: true
  });

  return CartItem;
};
