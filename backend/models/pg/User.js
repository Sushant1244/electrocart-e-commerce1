module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    passwordHash: { type: DataTypes.STRING },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpire: { type: DataTypes.BIGINT },
  // Email verification fields for OTP flow
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerificationToken: { type: DataTypes.STRING },
  emailVerificationExpire: { type: DataTypes.BIGINT },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  return User;
};
