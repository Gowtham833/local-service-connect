/**
 * Sequelize Models Index
 * Loads all models, runs associations, and exports db object.
 */
const CustomerModel = require('./Customer');
const WorkerModel   = require('./Worker');
const BookingModel  = require('./Booking');
const ReviewModel   = require('./Review');

const db = {};

function initModels(sequelize) {
  db.sequelize = sequelize;
  db.Customer  = CustomerModel(sequelize);
  db.Worker    = WorkerModel(sequelize);
  db.Booking   = BookingModel(sequelize);
  db.Review    = ReviewModel(sequelize);

  // Run associations
  Object.values(db).forEach(model => {
    if (model?.associate) model.associate(db);
  });

  return db;
}

module.exports = initModels;
module.exports.db = db;
