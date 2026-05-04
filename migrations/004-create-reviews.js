'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reviews', {
      id:              { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      booking_id:      { type: Sequelize.UUID, allowNull: false, unique: true, references: { model: 'bookings', key: 'id' }, onDelete: 'CASCADE' },
      customer_id:     { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' } },
      worker_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'workers', key: 'id' } },
      rating:          { type: Sequelize.INTEGER, allowNull: false },
      comment:         { type: Sequelize.TEXT },
      sentiment:       { type: Sequelize.ENUM('POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED') },
      sentiment_score: { type: Sequelize.JSONB },
      created_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('reviews', ['worker_id']);
    await queryInterface.addIndex('reviews', ['customer_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('reviews');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reviews_sentiment";');
  }
};
