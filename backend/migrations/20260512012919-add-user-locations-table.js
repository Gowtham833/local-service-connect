'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add profilePhotoUrl to customers
    await queryInterface.addColumn('customers', 'profile_photo_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    // 2. Add beforeWorkPhotoUrls to bookings
    await queryInterface.addColumn('bookings', 'before_work_photo_urls', {
      type: Sequelize.JSON,
      defaultValue: []
    });

    // 3. Add afterWorkPhotoUrls to bookings
    await queryInterface.addColumn('bookings', 'after_work_photo_urls', {
      type: Sequelize.JSON,
      defaultValue: []
    });

    // 4. Create user_locations table
    await queryInterface.createTable('user_locations', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      accuracy: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_locations');
    await queryInterface.removeColumn('bookings', 'after_work_photo_urls');
    await queryInterface.removeColumn('bookings', 'before_work_photo_urls');
    await queryInterface.removeColumn('customers', 'profile_photo_url');
  }
};
