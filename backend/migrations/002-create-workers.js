'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('workers', {
      id:           { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      first_name:   { type: Sequelize.STRING(100), allowNull: false },
      last_name:    { type: Sequelize.STRING(100) },
      email:        { type: Sequelize.STRING(255), unique: true },
      phone:        { type: Sequelize.STRING(20), allowNull: false, unique: true },
      city:         { type: Sequelize.STRING(100) },
      skills:       { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      experience:   { type: Sequelize.STRING(500) },
      password_hash:{ type: Sequelize.STRING, allowNull: false },
      avatar:       { type: Sequelize.STRING(10), defaultValue: '👷' },
      is_available: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_verified:  { type: Sequelize.BOOLEAN, defaultValue: false },
      rating:       { type: Sequelize.FLOAT, defaultValue: 0 },
      lat:          { type: Sequelize.FLOAT },
      lng:          { type: Sequelize.FLOAT },
      cognito_sub:  { type: Sequelize.STRING },
      is_active:    { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('workers', ['phone']);
    await queryInterface.addIndex('workers', ['city']);
    await queryInterface.addIndex('workers', ['is_available']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('workers');
  }
};
