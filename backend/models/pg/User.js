module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true, allowNull: false, set(value) { this.setDataValue('email', String(value).trim().toLowerCase()); } },
    phone: { type: DataTypes.STRING },
    passwordHash: { type: DataTypes.STRING },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.BIGINT },
  // Email verification fields for OTP flow
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerificationToken: { type: DataTypes.STRING },
  emailVerificationExpire: { type: DataTypes.BIGINT },
  role: { type: DataTypes.STRING, defaultValue: 'customer' },
  twoFactorSecret: { type: DataTypes.TEXT },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  backupCodes: { type: DataTypes.JSONB, defaultValue: [] },
  googleId: { type: DataTypes.STRING, unique: true },
  failedLoginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return User;
};
