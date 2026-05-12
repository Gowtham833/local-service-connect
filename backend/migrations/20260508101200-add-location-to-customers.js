'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('customers', 'lat', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
    await queryInterface.addColumn('customers', 'lng', {
      type: Sequelize.FLOAT,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('customers', 'lat');
    await queryInterface.removeColumn('customers', 'lng');
  }
};
