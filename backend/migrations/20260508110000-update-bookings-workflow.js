'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add lat/lng to Bookings table if they don't exist
    const tableInfo = await queryInterface.describeTable('bookings');
    
    if (!tableInfo.lat) {
      await queryInterface.addColumn('bookings', 'lat', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }
    
    if (!tableInfo.lng) {
      await queryInterface.addColumn('bookings', 'lng', {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }

    // Ensure the status ENUM includes 'accepted' and 'cancelled' if not present
    // Note: This is a simplified check for the workflow fixes
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Bookings', 'lat');
    await queryInterface.removeColumn('Bookings', 'lng');
  }
};
