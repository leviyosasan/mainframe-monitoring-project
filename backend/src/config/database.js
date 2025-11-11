const { Pool } = require('pg');

// Default PostgreSQL configuration for application database
const DEFAULT_APP_CONFIG = {
  host: process.env.DB_HOST || '192.168.60.148',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mainview',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345678'
};

// Create a singleton pool for application database (users, custom_folders, custom_dashboards)
const appPool = new Pool(DEFAULT_APP_CONFIG);

appPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = appPool;

