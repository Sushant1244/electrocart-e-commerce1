module.exports = (sequelize, DataTypes) => {
  const AuthToken = sequelize.define('AuthToken', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('email_verification', 'password_reset', 'otp', 'email_change'), allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    usedAt: { type: DataTypes.DATE },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    metadata: { type: DataTypes.JSONB, defaultValue: {} }
  }, {
    tableName: 'auth_tokens',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'type'] },
      { fields: ['tokenHash'] },
      { fields: ['expiresAt'] }
    ]
  });

  return AuthToken;
};
