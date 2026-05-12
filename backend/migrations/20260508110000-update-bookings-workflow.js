'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add lat and lng to bookings
    await queryInterface.addColumn('bookings', 'lat', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('bookings', 'lng', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // Update status ENUM to include 'accepted' and 'in_progress'
    // Note: Postgres ENUM updates can be tricky. We use raw SQL for reliability.
    await queryInterface.sequelize.query('ALTER TYPE "enum_bookings_status" ADD VALUE IF NOT EXISTS \'accepted\'');
    await queryInterface.sequelize.query('ALTER TYPE "enum_bookings_status" ADD VALUE IF NOT EXISTS \'in_progress\'');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bookings', 'lat');
    await queryInterface.removeColumn('bookings', 'lng');
    // Note: Dropping ENUM values is not supported by Postgres easily.
  }
};
