const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserLocation = sequelize.define('UserLocation', {
    userId: { 
      type: DataTypes.UUID, 
      primaryKey: true 
    },
    role: { 
      type: DataTypes.STRING(20), 
      allowNull: false 
    },
    latitude: { 
      type: DataTypes.DECIMAL(10, 8), 
      allowNull: false 
    },
    longitude: { 
      type: DataTypes.DECIMAL(11, 8), 
      allowNull: false 
    },
    accuracy: { 
      type: DataTypes.DECIMAL(8, 2), 
      allowNull: true 
    },
  }, { 
    tableName: 'user_locations', 
    underscored: true,
    timestamps: true, // Will automatically add createdAt and updatedAt
  });

  return UserLocation;
};
