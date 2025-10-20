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

const getMainviewMvsSysover = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Query mainview_mvs_sysover table
    const query = `
      SELECT 
        id,
        syxsysn,
        succpub,
        sucziib,
        scicpavg,
        suciinrt,
        suklqior,
        sukadbpc,
        csrecspu,
        csreecpu,
        csresqpu,
        csreespu,
        bmctime,
        "time"
      FROM mainview_mvs_sysover 
      ORDER BY bmctime DESC 
      LIMIT 100
    `;
    
    const result = await client.query(query);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'mainview_mvs_sysover verileri başarıyla getirildi',
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('mainview_mvs_sysover query error:', error);
    
    res.status(500).json({
      success: false,
      message: 'mainview_mvs_sysover verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};

const checkTableExists = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Check if table exists and get table info
    const tableCheckQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mainview_mvs_sysover'
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableCheckQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_mvs_sysover`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_mvs_sysover LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'Tablo bilgileri başarıyla getirildi',
      tableInfo: {
        exists: tableResult.rows.length > 0,
        columns: tableResult.rows,
        rowCount: parseInt(countResult.rows[0].count),
        sampleData: sampleResult.rows
      }
    });
    
  } catch (error) {
    console.error('Table check error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Tablo kontrolü başarısız',
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
  testConnection,
  getMainviewMvsSysover,
  checkTableExists
};
