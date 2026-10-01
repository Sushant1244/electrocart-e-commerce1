const { Client } = require('pg');

// Read POSTGRES_URL from env or fallback
const POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://postgres:root@localhost:5432/postgres';

async function createDb() {
  // connect to the default 'postgres' db to run CREATE DATABASE
  const url = POSTGRES_URL.replace(/\/([^\/]+)$/, '/postgres');
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const dbName = process.env.PG_DB_NAME || 'electrocart e-commerce';
    // check if exists
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (res.rowCount > 0) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      // create database with proper quoting
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`Database '${dbName}' created.`);
    }
  } catch (err) {
    console.error('Failed to create DB:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

createDb();
