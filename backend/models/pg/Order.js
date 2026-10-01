module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    orderItems: { type: DataTypes.JSONB, defaultValue: [] },
    shippingAddress: { type: DataTypes.JSONB },
    paymentResult: { type: DataTypes.JSONB },
  // paymentSession stores provider session info like { provider: 'khalti', pidx: '...', initiatedAt: ... }
  paymentSession: { type: DataTypes.JSONB },
    totalPrice: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING, defaultValue: 'processing' },
  deliveryStatus: { type: DataTypes.STRING, defaultValue: 'pending' },
  trackingNumber: { type: DataTypes.STRING },
  deliveryUpdates: { type: DataTypes.JSONB, defaultValue: [] },
    isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
    paidAt: { type: DataTypes.DATE },
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  return Order;
};
