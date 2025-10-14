const { Pool } = require('pg');

// Default PostgreSQL configuration
const DEFAULT_CONFIG = {
  'database': {
    'host': "192.168.60.145",
    'port': 5432,
    'database': "mainview",
    'user': "postgres",
    'password': "12345678"
  }
};

const testConnection = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Get database version and basic info
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    
    // Get database name
    const dbNameResult = await client.query('SELECT current_database()');
    const database = dbNameResult.rows[0].current_database;
    
    // Get current user
    const userResult = await client.query('SELECT current_user');
    const user = userResult.rows[0].current_user;
    
    // Get server time
    const timeResult = await client.query('SELECT now()');
    const serverTime = timeResult.rows[0].now;
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'PostgreSQL bağlantısı başarılı',
      connectionInfo: {
        host: config.host,
        port: config.port,
        database: database,
        user: user,
        version: version,
        serverTime: serverTime
      }
    });
    
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    
    res.status(500).json({
      success: false,
      message: 'PostgreSQL bağlantısı başarısız',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};

module.exports = {
  testConnection
};
