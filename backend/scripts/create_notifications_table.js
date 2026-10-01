const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const POSTGRES_URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!POSTGRES_URL) {
  console.error('No POSTGRES_URL / DATABASE_URL in env; cannot run migration');
  process.exit(1);
}

(async () => {
  const sequelize = new Sequelize(POSTGRES_URL, { dialect: 'postgres', logging: false });
  try {
    await sequelize.authenticate();
    const qi = sequelize.getQueryInterface();
    const tables = await qi.showAllTables();
    const names = (tables || []).map(t => (typeof t === 'string' ? t : (t.tableName || t.name))).map(n => String(n).toLowerCase());
    if (names.includes('notifications')) {
      console.log('notifications table already exists; nothing to do');
      process.exit(0);
    }

    console.log('Creating notifications table...');
    await qi.createTable('notifications', {
      id: { type: 'SERIAL', primaryKey: true },
      userId: { type: 'INTEGER' },
      title: { type: 'VARCHAR(255)', allowNull: false },
      body: { type: 'TEXT' },
      meta: { type: 'JSONB', defaultValue: '{}' },
      read: { type: 'BOOLEAN', defaultValue: false },
      createdAt: { type: 'TIMESTAMP', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: 'TIMESTAMP', defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    console.log('notifications table created');
    process.exit(0);
  } catch (e) {
    console.error('Failed to create notifications table:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
})();
