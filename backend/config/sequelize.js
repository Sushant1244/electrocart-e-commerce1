const { Sequelize, DataTypes } = require('sequelize');

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.VERCEL_POSTGRES_URL || null;

if (!POSTGRES_URL) {
  // No Postgres configured — export null so callers can gracefully fall back.
  module.exports = null;
} else {
  const sequelize = new Sequelize(POSTGRES_URL, {
    dialect: 'postgres',
    logging: false,
  });

  // load models
  const Product = require('../models/pg/Product')(sequelize, DataTypes);
  const User = require('../models/pg/User')(sequelize, DataTypes);
  const Order = require('../models/pg/Order')(sequelize, DataTypes);
  const Review = require('../models/pg/Review')(sequelize, DataTypes);
  const Notification = require('../models/pg/Notification')(sequelize, DataTypes);
  const Wishlist = require('../models/pg/Wishlist')(sequelize, DataTypes);
  const CartItem = require('../models/pg/CartItem')(sequelize, DataTypes);
  const PaymentMethod = require('../models/pg/PaymentMethod')(sequelize, DataTypes);

  // associations
  User.hasMany(Order, { foreignKey: 'userId' });
  Order.belongsTo(User, { foreignKey: 'userId' });
  // Wishlist/Cart associations
  User.hasMany(Wishlist, { foreignKey: 'userId' });
  Wishlist.belongsTo(User, { foreignKey: 'userId' });
  Product.hasMany(Wishlist, { foreignKey: 'productId' });
  Wishlist.belongsTo(Product, { foreignKey: 'productId' });

  User.hasMany(CartItem, { foreignKey: 'userId' });
  CartItem.belongsTo(User, { foreignKey: 'userId' });
  Product.hasMany(CartItem, { foreignKey: 'productId' });
  CartItem.belongsTo(Product, { foreignKey: 'productId' });
  // Reviews associations
  Product.hasMany(Review, { foreignKey: 'productId' });
  Review.belongsTo(Product, { foreignKey: 'productId' });
  User.hasMany(Review, { foreignKey: 'userId' });
  Review.belongsTo(User, { foreignKey: 'userId' });

  // PaymentMethod associations
  User.hasMany(PaymentMethod, { foreignKey: 'userId' });
  PaymentMethod.belongsTo(User, { foreignKey: 'userId' });

  module.exports = { sequelize, Product, User, Order, Review, Notification, Wishlist, CartItem, PaymentMethod };
}

