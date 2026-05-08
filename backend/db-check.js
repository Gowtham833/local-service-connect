const { db } = require('./models/index');
require('dotenv').config();
const { loadConfig } = require('./config/aws');

async function check() {
  const config = await loadConfig();
  const { getSequelize } = require('./config/database');
  const seq = getSequelize(config);
  require('./models/index')(seq);
  
  const bookings = await db.Booking.findAll();
  console.log('Bookings:', JSON.stringify(bookings, null, 2));
  
  const workers = await db.Worker.findAll();
  console.log('Workers:', JSON.stringify(workers, null, 2));
  
  process.exit(0);
}

check().catch(console.error);
