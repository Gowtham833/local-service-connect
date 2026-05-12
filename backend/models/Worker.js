const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Worker = sequelize.define('Worker', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstName:    { type: DataTypes.STRING(100), allowNull: false },
    lastName:     { type: DataTypes.STRING(100), allowNull: true },
    email:        { type: DataTypes.STRING(255), allowNull: true, unique: true },
    phone:        { type: DataTypes.STRING(20),  allowNull: false, unique: true },
    city:         { type: DataTypes.STRING(100), allowNull: true },
    skills:       { 
      type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING), 
      defaultValue: [] 
    },
    experience:   { type: DataTypes.STRING(500), allowNull: true },
    passwordHash: { type: DataTypes.STRING,      allowNull: false },
    avatar:       { type: DataTypes.STRING(10),  defaultValue: '👷' },
    isAvailable:  { type: DataTypes.BOOLEAN,     defaultValue: false },
    isVerified:   { type: DataTypes.BOOLEAN,     defaultValue: false },
    rating:       { type: DataTypes.FLOAT,       defaultValue: 0 },
    lat:          { type: DataTypes.FLOAT,       allowNull: true },
    lng:          { type: DataTypes.FLOAT,       allowNull: true },
    completionRate: { type: DataTypes.FLOAT,     defaultValue: 1.0 },
    responseTime:   { type: DataTypes.INTEGER,   defaultValue: 5 }, // In minutes
    cancellationRate: { type: DataTypes.FLOAT,   defaultValue: 0.0 },
    vehicleInfo:  { type: DataTypes.STRING(200), allowNull: true },
    cognitoSub:   { type: DataTypes.STRING,      allowNull: true },
    isActive:     { type: DataTypes.BOOLEAN,     defaultValue: true },

    // ── Identity Verification Fields ──────────────────────────
    aadhaarNumber:        { type: DataTypes.STRING(20),  allowNull: true },
    aadhaarFrontImageUrl: { type: DataTypes.STRING(500), allowNull: true },
    aadhaarBackImageUrl:  { type: DataTypes.STRING(500), allowNull: true },
    liveSelfieImageUrl:   { type: DataTypes.STRING(500), allowNull: true },
    profilePhotoUrl:      { type: DataTypes.STRING(500), allowNull: true },
    verificationStatus:   { 
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    verificationNotes:    { type: DataTypes.TEXT,  allowNull: true },
  }, { tableName: 'workers', underscored: true });

  Worker.associate = (models) => {
    Worker.hasMany(models.Booking, { foreignKey: 'workerId', as: 'jobs'    });
    Worker.hasMany(models.Review,  { foreignKey: 'workerId', as: 'reviews' });
  };

  return Worker;
};
