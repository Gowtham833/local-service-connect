/**
 * Sequelize CLI config (separate from runtime config)
 * Used only by: npx sequelize-cli db:migrate / db:seed
 * Reads from environment variables (no hardcoding)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'serviconnect',
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    dialect:  'postgres',
    logging:  false,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'testpassword',
    database: process.env.DB_NAME || 'serviconnect_test',
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    dialect:  'postgres',
    logging:  false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT) || 5432,
    dialect:  'postgres',
    logging:  false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
