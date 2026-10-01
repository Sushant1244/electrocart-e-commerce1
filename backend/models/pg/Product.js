module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.FLOAT, allowNull: false },
    originalPrice: { type: DataTypes.FLOAT },
    countInStock: { type: DataTypes.INTEGER, defaultValue: 0 },
    images: { type: DataTypes.JSONB, defaultValue: [] },
    category: { type: DataTypes.STRING },
    brand: { type: DataTypes.STRING },
    rating: { type: DataTypes.FLOAT, defaultValue: 0 },
    numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'products',
    timestamps: true,
  });

  return Product;
};
