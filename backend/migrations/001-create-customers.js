'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('customers', {
      id:           { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      first_name:   { type: Sequelize.STRING(100), allowNull: false },
      last_name:    { type: Sequelize.STRING(100) },
      email:        { type: Sequelize.STRING(255), unique: true },
      phone:        { type: Sequelize.STRING(20), allowNull: false, unique: true },
      city:         { type: Sequelize.STRING(100) },
      password_hash:{ type: Sequelize.STRING, allowNull: false },
      avatar:       { type: Sequelize.STRING(10), defaultValue: '👤' },
      cognito_sub:  { type: Sequelize.STRING },
      is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('customers', ['phone']);
    await queryInterface.addIndex('customers', ['email']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('customers');
  }
};
