const { getSequelize } = require('./config/database');
const initModels = require('./models/index');
const bcrypt = require('bcryptjs');

async function seed() {
  const sequelize = getSequelize({
    dbDialect: 'sqlite',
    dbName: 'serviconnect',
    dbUser: '',
    dbPass: '',
    dbHost: 'localhost'
  });
  const models = initModels(sequelize);
  await sequelize.sync();

  const passHash = await bcrypt.hash('password123', 12);

  await models.Customer.findOrCreate({
    where: { phone: '9876543210' },
    defaults: {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'customer@demo.com',
      passwordHash: passHash,
      city: 'Hyderabad'
    }
  });

  await models.Worker.findOrCreate({
    where: { phone: '9123456789' },
    defaults: {
      firstName: 'Demo',
      lastName: 'Worker',
      email: 'worker@demo.com',
      passwordHash: passHash,
      city: 'Hyderabad',
      skills: ['Plumbing', 'Electrical'],
      experience: '5 years'
    }
  });

  console.log('Seed completed!');
  process.exit(0);
}

seed();
