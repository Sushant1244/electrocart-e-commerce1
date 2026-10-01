module.exports = (sequelize, DataTypes) => {
  const AuthSession = sequelize.define('AuthSession', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    familyId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
    tokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    userAgent: { type: DataTypes.STRING(512) },
    ip: { type: DataTypes.STRING(64) },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE },
    replacedBy: { type: DataTypes.UUID }
  }, {
    tableName: 'auth_sessions',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['familyId'] },
      { fields: ['expiresAt'] }
    ]
  });

  return AuthSession;
};
