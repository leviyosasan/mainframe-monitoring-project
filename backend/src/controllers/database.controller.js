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
    
    //   database version and basic info
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

const checkTableExistsJespool = async (req, res) => {
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
      WHERE table_name = 'mainview_mvs_jespool'
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableCheckQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_mvs_jespool`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_mvs_jespool LIMIT 5`;
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


const getMainviewMvsJespool = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Query mainview_mvs_jespool table
    const query = `
      SELECT 
        id,
        bmctime, 
        time, 
        smf_id, 
        total_volumes, 
        spool_util, 
        total_tracks,  
        used_tracks, 
        active_spool_util, 
        total_active_tracks, 
        used_active_tracks,
        active_volumes, 
        volume, 
        status, 
        volume_util,
        volume_tracks, 
        volume_used, 
        other_volumes
      FROM mainview_mvs_jespool 
      ORDER BY bmctime DESC 
      LIMIT 100
    `;
    
    const result = await client.query(query);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'mainview_mvs_jespool verileri başarıyla getirildi',
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('mainview_mvs_jespool query error:', error);
    
    res.status(500).json({
      success: false,
      message: 'mainview_mvs_jespool verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};

const getMainviewMvsJCPU = async (req, res) => {
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    const pool = new Pool(config);

    const client = await pool.connect();

    const query = `
      SELECT 
        jobname, jes_job_number, address_space_type, service_class_name, asgrnmc, job_step_being_monitored,
        all_cpu_seconds, unadj_cpu_util_with_all_enclaves, using_cpu_percentage, cpu_delay_percentage,
        average_priority, tcb_time, percentage_srb_time, interval_unadj_remote_enclave_cpu_use,
        job_total_cpu_time, other_address_space_enclave_cpu_time, ziip_total_cpu_time, ziip_interval_cpu_time,
        dependent_enclave_ziip_total_time, dependent_enclave_ziip_interval_time, dependent_enclave_ziip_on_cp_total,
        interval_cp_time, resource_group_name, resource_group_type, recovery_process_boost,
        implicit_cpu_critical_flag, time, bmctime
      FROM mainview_mvs_jcpu
      ORDER BY bmctime DESC
    `;

    const result = await client.query(query);
    client.release();

    res.status(200).json({
      success: true,
      message: 'mainview_mvs_jcpu verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_mvs_jcpu query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_mvs_jcpu verileri getirilemedi',
      error: error.message
    });
  }
};

const checkTableExistsJCPU = async (req, res) => {
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
      WHERE table_name = 'mainview_mvs_jcpu'
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableCheckQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_mvs_jcpu`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_mvs_jcpu LIMIT 5`;
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
  getMainviewMvsJespool,
  checkTableExists,
  checkTableExistsJespool,
  getMainviewMvsJCPU,
  checkTableExistsJCPU
};
