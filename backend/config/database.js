const { Sequelize } = require('sequelize');
const path = require('path');

let sequelizeInstance = null;

/**
 * Returns a singleton Sequelize instance.
 * Config is passed in from the loadConfig() result (from aws.js).
 */
function getSequelize(config) {
  if (sequelizeInstance) return sequelizeInstance;

  if (process.env.DB_DIALECT === 'sqlite') {
    sequelizeInstance = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });
    return sequelizeInstance;
  }

  const sslOptions = (config.dbHost && config.dbHost.includes('rds.amazonaws.com')) || process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

  sequelizeInstance = new Sequelize(
    config.dbName,
    config.dbUser,
    config.dbPass,
    {
      host:    config.dbHost,
      port:    config.dbPort || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: sslOptions,
    }
  );

  return sequelizeInstance;
}

module.exports = { getSequelize };
