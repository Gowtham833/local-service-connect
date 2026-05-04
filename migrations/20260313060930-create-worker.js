'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Workers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      skills: {
        type: Sequelize.JSON
      },
      experience: {
        type: Sequelize.STRING
      },
      passwordHash: {
        type: Sequelize.STRING
      },
      avatar: {
        type: Sequelize.STRING
      },
      isAvailable: {
        type: Sequelize.BOOLEAN
      },
      isVerified: {
        type: Sequelize.BOOLEAN
      },
      rating: {
        type: Sequelize.FLOAT
      },
      totalJobs: {
        type: Sequelize.INTEGER
      },
      totalEarnings: {
        type: Sequelize.DECIMAL
      },
      jobsThisMonth: {
        type: Sequelize.INTEGER
      },
      earningsThisMonth: {
        type: Sequelize.DECIMAL
      },
      createdAt: {
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
    await queryInterface.dropTable('Workers');
  }
};