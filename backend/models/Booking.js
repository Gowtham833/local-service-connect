const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Booking = sequelize.define('Booking', {
    id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId:          { type: DataTypes.UUID, allowNull: false },
    workerId:            { type: DataTypes.UUID, allowNull: true },
    service:             { type: DataTypes.STRING(100), allowNull: false },
    description:         { type: DataTypes.TEXT,        allowNull: true },
    address:             { type: DataTypes.STRING(500),  allowNull: false },
    status: {
      type: DataTypes.ENUM('open', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'open',
    },
    price:               { type: DataTypes.FLOAT, allowNull: true },
    aiSuggestedPrice:    { type: DataTypes.FLOAT, allowNull: true },
    aiMatchedWorkerIds:  { 
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.UUID), 
      defaultValue: [] 
    },
    aiJobSummary:        { type: DataTypes.TEXT,  allowNull: true },
    acceptedAt:          { type: DataTypes.DATE,  allowNull: true },
    completedAt:         { type: DataTypes.DATE,  allowNull: true },
    lat:                 { type: DataTypes.FLOAT, allowNull: true },
    lng:                 { type: DataTypes.FLOAT, allowNull: true },

    // ── Photo Workflow Fields ─────────────────────────────────
    issuePhotoUrls:      { type: DataTypes.JSON,  defaultValue: [] },      // Customer uploads before booking
    completionPhotoUrls: { type: DataTypes.JSON,  defaultValue: [] },      // Worker uploads after job
    completionNotes:     { type: DataTypes.TEXT,   allowNull: true },       // Worker notes on completion
  }, { tableName: 'bookings', underscored: true });

  Booking.associate = (models) => {
    Booking.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Booking.belongsTo(models.Worker,   { foreignKey: 'workerId',   as: 'worker'   });
    Booking.hasOne(models.Review,      { foreignKey: 'bookingId',  as: 'review'   });
  };

  return Booking;
};
