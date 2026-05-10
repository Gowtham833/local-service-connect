const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    phone:     { type: DataTypes.STRING(20), allowNull: false },
    role:      { type: DataTypes.ENUM('customer', 'worker'), allowNull: false },
    otp:       { type: DataTypes.STRING(6), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used:      { type: DataTypes.BOOLEAN, defaultValue: false },
    attempts:  { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: 'password_reset_tokens', underscored: true });

  return PasswordResetToken;
};
