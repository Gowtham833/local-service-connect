const { Sequelize } = require('sequelize');

let sequelizeInstance = null;

/**
 * Returns a singleton Sequelize instance.
 * Config is passed in from the loadConfig() result (from aws.js).
 */
function getSequelize(config) {
  if (sequelizeInstance) return sequelizeInstance;

  const sslOptions = config.dbHost && config.dbHost.includes('rds.amazonaws.com')
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
