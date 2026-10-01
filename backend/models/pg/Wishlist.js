module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define('Wishlist', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    meta: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'wishlists',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['productId'] }]
  });

  return Wishlist;
};
