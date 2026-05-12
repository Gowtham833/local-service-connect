'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id:                    { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      customer_id:           { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
      worker_id:             { type: Sequelize.UUID, references: { model: 'workers', key: 'id' }, onDelete: 'SET NULL' },
      service:               { type: Sequelize.STRING(100), allowNull: false },
      description:           { type: Sequelize.TEXT },
      address:               { type: Sequelize.STRING(500), allowNull: false },
      status:                { type: Sequelize.ENUM('open', 'pending', 'active', 'completed', 'cancelled'), defaultValue: 'open' },
      price:                 { type: Sequelize.FLOAT },
      ai_suggested_price:    { type: Sequelize.FLOAT },
      ai_matched_worker_ids: { type: Sequelize.ARRAY(Sequelize.UUID), defaultValue: [] },
      ai_job_summary:        { type: Sequelize.TEXT },
      accepted_at:           { type: Sequelize.DATE },
      completed_at:          { type: Sequelize.DATE },
      created_at:            { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:            { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('bookings', ['customer_id']);
    await queryInterface.addIndex('bookings', ['worker_id']);
    await queryInterface.addIndex('bookings', ['status']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
  }
};
