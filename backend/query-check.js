const { db } = require('./models/index');
const { Op } = require('sequelize');
require('dotenv').config();
const { loadConfig } = require('./config/aws');

async function check() {
  const config = await loadConfig();
  const { getSequelize } = require('./config/database');
  const seq = getSequelize(config);
  require('./models/index')(seq);
  
  const worker = await db.Worker.findOne({ where: { firstName: 'Gowtham' }});
  console.log('Worker skills:', worker.skills);

  const openJobs = await db.Booking.findAll({
      where: {
        status: 'open',
        service: { [Op.in]: worker.skills },
      },
      order: [['createdAt', 'DESC']]
  });
  console.log('Open jobs for worker:', openJobs.length);
  process.exit(0);
}

check().catch(console.error);
