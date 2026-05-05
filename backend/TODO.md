# Backend DB Integration TODO
Previous: Root Sequelize setup done.

**Current Status:** Structure ready, no code changes to routes yet.

**5. Backend Sequelize Setup**
- Create backend/models/index.js (link to root models/ via path)
- Update backend/server.js (import db, connect)
- Refactor backend/models/store.js to use Sequelize models

**6. Code Refactor**
- Replace array ops with model.findByPk/create/findAll/update etc.
- Handle ID change: string prefix -> INTEGER auto
- Associations: Customer.hasMany(Bookings), etc.

**7. Migrate & Test**
- Start Postgres, `npm run db:migrate`
- Seed
- Test endpoints

Next tool steps incoming.
