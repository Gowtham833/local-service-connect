const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName:    { type: DataTypes.STRING(100), allowNull: false },
    lastName:     { type: DataTypes.STRING(100), allowNull: true },
    email:        { type: DataTypes.STRING(255), allowNull: true, unique: true },
    phone:        { type: DataTypes.STRING(20),  allowNull: false, unique: true },
    city:         { type: DataTypes.STRING(100), allowNull: true },
    passwordHash: { type: DataTypes.STRING,      allowNull: false },
    avatar:       { type: DataTypes.STRING(10),  defaultValue: '👤' },
    cognitoSub:   { type: DataTypes.STRING,      allowNull: true },
    isActive:     { type: DataTypes.BOOLEAN,     defaultValue: true },
  }, { tableName: 'customers', underscored: true });

  Customer.associate = (models) => {
    Customer.hasMany(models.Booking, { foreignKey: 'customerId', as: 'bookings' });
    Customer.hasMany(models.Review,  { foreignKey: 'customerId', as: 'reviews'  });
  };

  return Customer;
};
