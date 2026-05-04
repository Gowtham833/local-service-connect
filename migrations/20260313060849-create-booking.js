'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      customerId: {
        type: Sequelize.STRING
      },
      workerId: {
        type: Sequelize.STRING
      },
      service: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      address: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      price: {
        type: Sequelize.DECIMAL
      },
      rating: {
        type: Sequelize.INTEGER
      },
      review: {
        type: Sequelize.TEXT
      },
      createdAt: {
        type: Sequelize.DATE
      },
      completedAt: {
        type: Sequelize.DATE
      },
      acceptedAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Bookings');
  }
};