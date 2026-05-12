const { Sequelize } = require('sequelize');
require('dotenv').config();

async function run() {
  const sslOptions = (process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com')) || process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

  const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: sslOptions,
  });

  console.log('🚀 Starting manual migration with SSL...');

  try {
    // 1. Update Workers table
    await sequelize.query('ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "profile_photo_url" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "verification_status" VARCHAR(50) DEFAULT \'pending\'');
    await sequelize.query('ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "face_match_confidence" FLOAT');
    await sequelize.query('ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "verification_notes" TEXT');
    await sequelize.query('ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "live_selfie_image_url" VARCHAR(255)');
    console.log('✅ Workers table updated.');

    // 2. Update Customers table
    await sequelize.query('ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "profile_photo_url" VARCHAR(255)');
    console.log('✅ Customers table updated.');

    // 3. Update Bookings table
    await sequelize.query('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "before_work_photo_urls" JSONB');
    await sequelize.query('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "after_work_photo_urls" JSONB');
    await sequelize.query('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "completion_notes" TEXT');
    console.log('✅ Bookings table updated.');

    // 4. Create UserLocations table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "user_locations" (
        "id" UUID PRIMARY KEY,
        "user_id" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "lat" FLOAT NOT NULL,
        "lng" FLOAT NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ UserLocations table created.');

    console.log('🎊 Manual migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
