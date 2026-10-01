module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    meta: { type: DataTypes.JSONB, defaultValue: {} },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'notifications',
    timestamps: true,
  });

  return Notification;
};
