const { Pool } = require('pg');

// Default PostgreSQL configuration
const DEFAULT_CONFIG = {
  'database': {
    'host': "192.168.60.148",
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
    
    // Get all tables in the database
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    // Check specifically for mainview_csasum table
    const csasumExists = tables.includes('mainview_csasum');
    
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
        serverTime: serverTime,
        tables: tables,
        tableCount: tables.length,
        mainview_csasum_exists: csasumExists
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

const getLatestCpuData = async (req, res) => {
  let pool = null;
  
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    // En son CPU verisini çek (mainview_mvs_sysover tablosundan)
    const query = `
      SELECT 
        syxsysn, succpub, bmctime, "time"
      FROM mainview_mvs_sysover
      ORDER BY bmctime DESC
      LIMIT 1
    `;

    const result = await client.query(query);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'CPU verisi bulunamadı'
      });
    }

    const cpuData = result.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        syxsysn: cpuData.syxsysn,
        cpuBusyPercent: cpuData.succpub,
        bmctime: cpuData.bmctime,
        time: cpuData.time
      }
    });
    
  } catch (error) {
    console.error('Latest CPU data error:', error);
    res.status(500).json({
      success: false,
      message: 'CPU verisi getirilemedi',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
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

// Check table exists for stacks
const checkTableExistsStacks = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Check if table exists
    const tableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mainview_network_stacks' 
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(tableQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_stacks`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_stacks LIMIT 5`;
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

// Get mainview_network_stacks data
const getMainviewNetworkStacks = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Create indexes for better performance (if they don't exist)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stacks_ipaddrc8 ON mainview_network_stacks(ipaddrc8);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stacks_bmctime ON mainview_network_stacks(bmctime DESC);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_stacks_ipaddrc8_bmctime ON mainview_network_stacks(ipaddrc8, bmctime DESC);
    `);
    
    // Get all data from mainview_network_stacks table with optimized query
    const query = `
      SELECT 
        jobnam8, stepnam8, jtarget, asid8, mvslvlx8, ver_rel, 
        startc8, ipaddrc8, status18, bmctime, "time"
      FROM mainview_network_stacks 
      ORDER BY bmctime DESC
    `;
    
    const result = await client.query(query);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'Stacks verileri başarıyla getirildi (index\'ler ile optimize edildi)',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Stacks data fetch error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Stacks verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};

// Check table exists for stackcpu
const checkTableExistsStackCPU = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Check if table exists
    const tableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mainview_network_stackcpu' 
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(tableQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_stackcpu`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_stackcpu LIMIT 5`;
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

// Get mainview_network_stackcpu data
const getMainviewNetworkStackCPU = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Get all data from mainview_network_stackcpu table with lowercase column names
    const query = `
      SELECT 
        statstks, ippktrcd, ippktrtr, ipoutred, ipoutrtr, bmctime, "time"
      FROM mainview_network_stackcpu 
      ORDER BY bmctime DESC
    `;
    
    const result = await client.query(query);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'StackCPU verileri başarıyla getirildi',
      data: result.rows
    });
    
  } catch (error) {
    console.error('StackCPU data fetch error:', error);
    
    res.status(500).json({
      success: false,
      message: 'StackCPU verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};

















// Check table exists for vtamcsa
const checkTableExistsVtamcsa = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Check if table exists
    const tableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mainview_network_vtamcsa' 
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(tableQuery);
    
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_vtamcsa`;
    const countResult = await client.query(countQuery);
    
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_vtamcsa LIMIT 5`;
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

const getMainviewNetworkTcpconf = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        job_name, stack_name, def_receive_bufsize, def_send_bufsize,
        def_max_receive_bufsize, maximum_queue_depth, max_retran_time,
        min_retran_time, roundtrip_gain, variance_gain, variance_multiple,
        default_keepalive, delay_ack, restrict_low_port, send_garbage,
        tcp_timestamp, ttls, finwait2time, system_name, created_at, updated_at
      FROM mainview_network_tcpconf
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_network_tcpconf verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_network_tcpconf query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_network_tcpconf verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExiststcpconf = async (req, res) => {
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
      WHERE table_name = 'mainview_network_tcpconf'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_tcpconf`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_tcpconf LIMIT 5`;
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
 
const getMainviewNetworktcpcons = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        foreign_ip_address, remote_port, local_port,
        application_name, type_of_open, interval_bytes_in, interval_bytes_out,
        connection_status, remote_host_name, system_name, created_at, updated_at
      FROM mainview_network_tcpcons
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_network_tcpcons verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_network_tcpcons query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_network_tcpcons verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExiststcpcons = async (req, res) => {
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
      WHERE table_name = 'mainview_network_tcpcons'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_tcpcons`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_tcpcons LIMIT 5`;
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
 
const getMainviewNetworkudpconf = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        job_name, stack_name, def_recv_bufsize, def_send_bufsize,
        check_summing, restrict_low_port, udp_queue_limit,
        system_name, created_at, updated_at
      FROM mainview_network_udpconf
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_network_udpconf verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_network_udpconf query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_network_udpconf verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExiststudpconf = async (req, res) => {
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
      WHERE table_name = 'mainview_network_udpconf'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_udpconf`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_udpconf LIMIT 5`;
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
 
const getMainviewNetworkactcons = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        foreign_ip_address, remote_port, local_ip_address, local_port,
        application_name, type_of_open, interval_bytes_in, interval_bytes_out,
        connection_status, remote_host_name, system_name, created_at, updated_at
      FROM mainview_network_actcons
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_network_actcons verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_network_actcons query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_network_actcons verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsactcons = async (req, res) => {
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
      WHERE table_name = 'mainview_network_actcons'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_actcons`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_network_actcons LIMIT 5`;
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

// Get mainview_network_vtamcsa data
const getMainviewNetworkVtamcsa = async (req, res) => {
  let pool = null;
  
  try {
    // Get configuration from request body or use default
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    
    // Create new pool with provided configuration
    pool = new Pool(config);
    
    // Test the connection
    const client = await pool.connect();
    
    // Get all data from mainview_network_vtamcsa table
    const query = `
      SELECT 
        id, j_system, csacur, csamax, csalim, csausage, c24cur, c24max, vtmcur, vtmmax, bmctime, "time"
      FROM mainview_network_vtamcsa 
      ORDER BY bmctime DESC
    `;
    
    const result = await client.query(query);
    
    client.release();
    
    res.status(200).json({
      success: true,
      message: 'VTAMCSA verileri başarıyla getirildi',
      data: result.rows
    });
    
  } catch (error) {
    console.error('VTAMCSA data fetch error:', error);
    
    res.status(500).json({
      success: false,
      message: 'VTAMCSA verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
















// Check table exists for vtmbuff
const checkTableExistsVtmbuff = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    const tableQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mainview_network_vtmbuff'
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(tableQuery);
    const exists = tableResult.rows.length > 0;

    if (!exists) {
      client.release();
      return res.status(200).json({
        success: true,
        message: 'Tablo bilgileri başarıyla getirildi',
        tableInfo: { exists: false, columns: [], rowCount: 0, sampleData: [] }
      });
    }

    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_vtmbuff`;
    const countResult = await client.query(countQuery);

    const sampleQuery = `SELECT * FROM mainview_network_vtmbuff LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Tablo bilgileri başarıyla getirildi',
      tableInfo: {
        exists: true,
        columns: tableResult.rows,
        rowCount: parseInt(countResult.rows[0].count),
        sampleData: sampleResult.rows
      }
    });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// Get mainview_network_vtmbuff data
const getMainviewNetworkVtmbuff = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

  // Use SELECT * to be resilient to schema differences; avoid ORDER BY on unknown column
  const query = `SELECT * FROM mainview_network_vtmbuff LIMIT 100`;
    const result = await client.query(query);
    client.release();

    res.status(200).json({ success: true, message: 'VTMBUFF verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('VTMBUFF query error:', error);
    res.status(500).json({ success: false, message: 'VTMBUFF verileri getirilemedi', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// Check table exists for tcpstor
const checkTableExistsTcpstor = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    const tableQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mainview_network_tcpstor'
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(tableQuery);
    const exists = tableResult.rows.length > 0;

    if (!exists) {
      client.release();
      return res.status(200).json({
        success: true,
        message: 'Tablo bilgileri başarıyla getirildi',
        tableInfo: { exists: false, columns: [], rowCount: 0, sampleData: [] }
      });
    }

    const countQuery = `SELECT COUNT(*) as count FROM mainview_network_tcpstor`;
    const countResult = await client.query(countQuery);

    const sampleQuery = `SELECT * FROM mainview_network_tcpstor LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Tablo bilgileri başarıyla getirildi',
      tableInfo: {
        exists: true,
        columns: tableResult.rows,
        rowCount: parseInt(countResult.rows[0].count),
        sampleData: sampleResult.rows
      }
    });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// Get mainview_network_tcpstor data
const getMainviewNetworkTcpstor = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    const query = `SELECT * FROM mainview_network_tcpstor ORDER BY record_timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();

    res.status(200).json({ success: true, message: 'TCPSTOR verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('TCPSTOR query error:', error);
    res.status(500).json({ success: false, message: 'TCPSTOR verileri getirilemedi', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// Check table exists for connsrpz
const checkTableExistsConnsrpz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    // Resolve table name robustly
    const tableName = await resolveConnsrpzTableName(client);
    if (!tableName) {
      client.release();
      return res.status(200).json({ success: true, message: 'Tablo bilgileri başarıyla getirildi', tableInfo: { exists: false, columns: [], rowCount: 0, sampleData: [] } });
    }

    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    const tableResult = await client.query(columnsQuery, [tableName]);
    const exists = tableResult.rows.length > 0;

    if (!exists) {
      client.release();
      return res.status(200).json({
        success: true,
        message: 'Tablo bilgileri başarıyla getirildi',
        tableInfo: { exists: false, columns: [], rowCount: 0, sampleData: [] }
      });
    }

    const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    const countResult = await client.query(countQuery);

    const sampleQuery = `SELECT * FROM ${tableName} LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);

    client.release();

    res.status(200).json({
      success: true,
      message: 'Tablo bilgileri başarıyla getirildi',
      tableInfo: {
        exists: true,
        columns: tableResult.rows,
        rowCount: parseInt(countResult.rows[0].count),
        sampleData: sampleResult.rows
      }
    });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// Helper: resolve actual CONNSRPZ table name in DB
async function resolveConnsrpzTableName(client) {
  // Exact match first (case-insensitive)
  const exact = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE LOWER(table_name) = LOWER('mainview_network_connsrpz')
      AND table_schema NOT IN ('information_schema','pg_catalog')
    LIMIT 1
  `);
  if (exact.rows.length > 0) return exact.rows[0].table_name;

  // Alternate spelling used by some loaders
  const alt = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE LOWER(table_name) = LOWER('mainview_network_connrspz')
      AND table_schema NOT IN ('information_schema','pg_catalog')
    LIMIT 1
  `);
  if (alt.rows.length > 0) return alt.rows[0].table_name;

  // Try to find a close variant (typo-safe): mainview_network_conn%rpz%
  const like = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema NOT IN ('information_schema','pg_catalog')
      AND table_name ILIKE 'mainview\\_network\\_%'
      AND table_name ILIKE '%conn%'
      AND table_name ILIKE '%rpz%'
    ORDER BY table_name
    LIMIT 1
  `);
  if (like.rows.length > 0) return like.rows[0].table_name;

  return null;
}

// Get mainview_network_connsrpz data
const getMainviewNetworkConnsrpz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();

    const tableName = await resolveConnsrpzTableName(client);
    if (!tableName) {
      client.release();
      return res.status(200).json({ success: true, message: 'Tablo bulunamadı', count: 0, data: [] });
    }

    const query = `SELECT * FROM ${tableName} LIMIT 100`;
    const result = await client.query(query);
    client.release();

    res.status(200).json({ success: true, message: 'CONNSRPZ verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('CONNSRPZ query error:', error);
    res.status(500).json({ success: false, message: 'CONNSRPZ verileri getirilemedi', error: error.message });
  } finally {
    if (pool) await pool.end();
  }
};

// ============================
// MQ Tables (mq_connz, mq_qm, mq_w2over)
// ============================

const checkTableGeneric = async (res, client, tableName) => {
  const tableResult = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  const exists = tableResult.rows.length > 0;
  if (!exists) {
    return { exists: false, columns: [], rowCount: 0, sampleData: [] };
  }
  const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  const sampleResult = await client.query(`SELECT * FROM ${tableName} LIMIT 5`);
  return {
    exists: true,
    columns: tableResult.rows,
    rowCount: parseInt(countResult.rows[0].count),
    sampleData: sampleResult.rows
  };
};

const checkTableExistsMQConnz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableInfo = await checkTableGeneric(res, client, 'mainview_mq_connz');
    client.release();
    res.status(200).json({ success: true, message: 'Tablo bilgileri başarıyla getirildi', tableInfo });
  } catch (error) {
    console.error('MQ_CONNZ table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const getMainviewMQConnz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM mainview_mq_connz LIMIT 100`);
    client.release();
    res.status(200).json({ success: true, message: 'MQ_CONNZ verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('MQ_CONNZ query error:', error);
    res.status(500).json({ success: false, message: 'MQ_CONNZ verileri getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const checkTableExistsMQQm = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableInfo = await checkTableGeneric(res, client, 'mainview_mq_qm');
    client.release();
    res.status(200).json({ success: true, message: 'Tablo bilgileri başarıyla getirildi', tableInfo });
  } catch (error) {
    console.error('MQ_QM table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const getMainviewMQQm = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM mainview_mq_qm LIMIT 100`);
    client.release();
    res.status(200).json({ success: true, message: 'MQ_QM verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('MQ_QM query error:', error);
    res.status(500).json({ success: false, message: 'MQ_QM verileri getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const checkTableExistsMQW2over = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableInfo = await checkTableGeneric(res, client, 'mainview_mq_w2over');
    client.release();
    res.status(200).json({ success: true, message: 'Tablo bilgileri başarıyla getirildi', tableInfo });
  } catch (error) {
    console.error('MQ_W2OVER table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const getMainviewMQW2over = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const result = await client.query(`SELECT * FROM mainview_mq_w2over LIMIT 100`);
    client.release();
    res.status(200).json({ success: true, message: 'MQ_W2OVER verileri başarıyla getirildi', count: result.rowCount, data: result.rows });
  } catch (error) {
    console.error('MQ_W2OVER query error:', error);
    res.status(500).json({ success: false, message: 'MQ_W2OVER verileri getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

const getMainviewUSSZFS = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        zfs_file_system_name, system_name, owning_system, total_aggregate_size, 
        aggregate_used_percent, mount_mode, created_at, updated_at
      FROM mainview_zfs_file_systems
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_zfs_file_systems verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_zfs_file_systems query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_zfs_file_systems verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsZFS = async (req, res) => {
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
      WHERE table_name = 'mainview_zfs_file_systems'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_zfs_file_systems`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_zfs_file_systems LIMIT 5`;
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

const getMainviewStorageCsasum = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    console.log('CSASUM - Using config:', config);
    pool = new Pool(config);
 
    const client = await pool.connect();
    console.log('CSASUM - Database connected successfully');
 
    // First check if table exists
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mainview_csasum'
      );
    `;
    
    const tableExists = await client.query(tableCheckQuery);
    console.log('CSASUM - Table exists:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      throw new Error('Table mainview_csasum does not exist. Please run the table creation script first.');
    }
 
    // CSA Metrics query with correct column names from the table
    const query = `
      SELECT
        -- CSA Metrics
        csa_defined,
        csa_in_use,
        csa_in_use_percent,
        csa_free_areas_count,
        csa_converted,
        csa_converted_to_sqa_percent,
        csa_smallest_free_area,
        csa_largest_free_area,
        csa_largest_percent_of_total,
        csa_available,
        csa_available_percent,
        
        -- ECSA Metrics
        ecsa_defined,
        ecsa_in_use,
        ecsa_in_use_percent,
        ecsa_converted,
        ecsa_converted_to_esqa_percent,
        ecsa_free_areas_count,
        ecsa_available,
        ecsa_available_percent,
        ecsa_smallest_free_area,
        ecsa_largest_free_area,
        ecsa_largest_percent_of_total,
        
        -- RUCSA Metrics
        rucsa_defined,
        rucsa_in_use,
        rucsa_in_use_percent,
        rucsa_free_areas_count,
        rucsa_smallest_free_area,
        rucsa_largest_free_area,
        rucsa_largest_percent_of_total,
        
        -- ERUCSA Metrics
        erucsa_defined,
        erucsa_in_use,
        erucsa_in_use_percent,
        erucsa_free_areas_count,
        erucsa_smallest_free_area,
        erucsa_largest_free_area,
        erucsa_largest_percent_of_total,
        
        -- SQA Metrics
        sqa_defined,
        sqa_in_use,
        sqa_in_use_percent,
        sqa_available,
        sqa_available_percent,
        
        -- ESQA Metrics
        esqa_available,
        esqa_available_percent,
        
        -- Total Common Storage Metrics
        total_cs_defined,
        total_cs_used,
        total_cs_used_percent,
        total_converted_csa_ecsa,
        available_common_storage,
        available_common_storage_percent,
        
        -- High Shared Storage Metrics
        defined_high_shared_storage,
        used_high_shared_storage,
        percent_used_high_shared_storage,
        number_of_shared_memory_objects,
        used_hwm_high_shared_storage,
        percent_hwm_high_shared_storage,
        
        -- High Common Storage Metrics
        defined_high_common_storage,
        used_high_common_storage,
        percent_used_high_common_storage,
        number_of_common_memory_objects,
        used_hwm_high_common_storage,
        percent_hwm_high_common_storage,
        
        -- Additional fields
        created_at,
        timestamp
      FROM mainview_csasum
      ORDER BY created_at DESC
      LIMIT 100
    `;
 
    console.log('CSASUM - Executing query...');
    const result = await client.query(query);
    console.log('CSASUM - Query executed successfully, rows:', result.rowCount);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_csasum verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('CSASUM - Query error details:', error);
    console.error('CSASUM - Error message:', error.message);
    console.error('CSASUM - Error code:', error.code);
    console.error('CSASUM - Error detail:', error.detail);
    res.status(500).json({
      success: false,
      message: 'mainview_csasum verileri getirilemedi',
      error: error.message,
      details: error.detail || 'No additional details'
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsCsasum = async (req, res) => {
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
      WHERE table_name = 'mainview_csasum'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_csasum`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_csasum LIMIT 5`;
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

const getMainviewStorageFrminfoCenter = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        spispcav, spispcmn, spispcmx,
        spilpfav, spilpfmn, spilpfmx,
        spicpfav, spicpfmn, spicpfmx,
        spiqpcav, spiqpcmn, spiqpcmx,
        spiapfav, spiapfmn, spiapfmx,
        spiafcav, spiafcmn, spitfuav,
        spiafumn, spiafumx, spitcpct,
        bmctime, "time"
      FROM mainview_frminfo_central
      ORDER BY bmctime DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_frminfo_central verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_frminfo_central query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_frminfo_central verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsFrminfoCenter = async (req, res) => {
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
      WHERE table_name = 'mainview_frminfo_central'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_frminfo_central`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_frminfo_central LIMIT 5`;
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


const getMainviewStorageFrminfofixed = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        timestamp,
        system_name, server_name,
        sqa_avg, sqa_min, sqa_max,
        lpa_avg, lpa_min, lpa_max,
        csa_avg, csa_min, csa_max,
        lsqa_avg, lsqa_min, lsqa_max,
        private_avg, private_min, private_max,
        fixed_16m_avg, fixed_16m_min, fixed_16m_max,
        fixed_total_avg, fixed_total_min, fixed_total_max,
        fixed_percentage
      FROM mainview_frminfo_fixed
      ORDER BY timestamp DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    
    // Debug: Veri kalitesini kontrol edelim
    console.log('=== FRMINFO FIXED DEBUG ===');
    console.log('Query result count:', result.rowCount);
    if (result.rows.length > 0) {
      const firstRow = result.rows[0];
      console.log('First row data:');
      console.log('  timestamp:', firstRow.timestamp, typeof firstRow.timestamp);
      console.log('  system_name:', firstRow.system_name, typeof firstRow.system_name);
      console.log('  server_name:', firstRow.server_name, typeof firstRow.server_name);
      console.log('  All columns:', Object.keys(firstRow));
      console.log('  Full first row:', JSON.stringify(firstRow, null, 2));
    }
    console.log('=== END DEBUG ===');
    
    client.release();

    res.status(200).json({
      success: true,
      message: 'mainview_frminfo_fixed verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_frminfo_fixed query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_frminfo_fixed verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsFrminfoFixed = async (req, res) => {
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
      WHERE table_name = 'mainview_frminfo_fixed'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_frminfo_fixed`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_frminfo_fixed LIMIT 5`;
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


const getMainviewStorageFrminfoHighVirtual = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        timestamp,
        system_name, server_name,
        hv_common_avg, hv_common_min, hv_common_max,
        hv_shared_avg, hv_shared_min, hv_shared_max
      FROM mainview_frminfo_high_virtual
      ORDER BY timestamp DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_frminfo_high_virtual verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_frminfo_high_virtual query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_frminfo_high_virtual verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsFrminfoHighVirtual = async (req, res) => {
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
      WHERE table_name = 'mainview_frminfo_high_virtual'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_frminfo_high_virtual`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_frminfo_high_virtual LIMIT 5`;
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


const getMainviewStoragesysfrmiz = async (req, res) => {
  let pool = null;
 
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
 
    const client = await pool.connect();
 
    // Önce sadece tüm kolonları çekelim ve görelim
    const query = `
      SELECT
        spgid, 
        spluicav as spl,
        spiuonlf, spifinav, sprefncp, spispcav, spreasrp, spilpfav, sprealpp,
        spicpfav, spreavpp, spiqpcav, sprelsqp, spiapfav, spreprvp, spiafcav, spreavlp,
        spihvcav, sprecmnp, spihvsav, spreshrp, 
        bmc_time as bmctime
      FROM mainview_storage_sysfrmiz
      ORDER BY bmc_time DESC
      LIMIT 100
    `;
 
    const result = await client.query(query);
    client.release();
 
    res.status(200).json({
      success: true,
      message: 'mainview_storage_sysfrmiz verileri başarıyla getirildi',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    console.error('mainview_storage_sysfrmiz query error:', error);
    res.status(500).json({
      success: false,
      message: 'mainview_storage_sysfrmiz verileri getirilemedi',
      error: error.message
    });
  } finally {
    // Close the pool if it was created
    if (pool) {
      await pool.end();
    }
  }
};
 
const checkTableExistsSysfrmiz = async (req, res) => {
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
      WHERE table_name = 'mainview_storage_sysfrmiz'
      ORDER BY ordinal_position;
    `;
   
    const tableResult = await client.query(tableCheckQuery);
   
    // Get row count
    const countQuery = `SELECT COUNT(*) as count FROM mainview_storage_sysfrmiz`;
    const countResult = await client.query(countQuery);
   
    // Get sample data if exists
    const sampleQuery = `SELECT * FROM mainview_storage_sysfrmiz LIMIT 5`;
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

// ========== RMF Endpoints ==========

// RMF PGSPP
const checkTableExistsRmfPgspp = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_pgspp'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_pgspp`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfPgspp = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_pgspp ORDER BY timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF ARD
const checkTableExistsRmfArd = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_ard'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_ard`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfArd = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_ard ORDER BY updated_at DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF TRX
const checkTableExistsRmfTrx = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_trx'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_trx`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfTrx = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_trx ORDER BY bmctime DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF ASRM
const checkTableExistsRmfAsrm = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect帮تب;
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_asrm'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_asrm`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
兼具: console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfAsrm = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_asrm ORDER BY bmctime DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error depend', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF SRCS
const checkTableExistsRmfSrcs = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_srcs'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_srcs`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfSrcs = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_srcs ORDER BY bmctime DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF ASD
const checkTableExistsRmfAsd = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_asd'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_asd`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfAsd = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_asd ORDER BY record_timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// RMF SPAG
const checkTableExistsRmfSpag = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_rmf_spag'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_rmf_spag`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewRmfSpag = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_rmf_spag ORDER BY record_timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// CMF XCFSYS
const checkTableExistsCmfXcfsys = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_cmf_xcfsys'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_cmf_xcfsys`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewCmfXcfsys = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_cmf_xcfsys ORDER BY record_timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// CMF DSPCZ
const checkTableExistsCmfDspcz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_cmf_dspcz'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_cmf_dspcz`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewCmfDspcz = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_cmf_dspcz ORDER BY bmctime DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// CMF JCSA
const checkTableExistsCmfJcsa = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_cmf_jcsa'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_cmf_jcsa`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewCmfJcsa = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_cmf_jcsa ORDER BY bmc_time DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// CMF XCFMBR
const checkTableExistsCmfXcfmbr = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_xcfmbr'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_xcfmbr`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewCmfXcfmbr = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_xcfmbr ORDER BY timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

// CMF SYSCPC
const checkTableExistsCmfSyscpc = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const tableCheckQuery = `SELECT table_name FROM information_schema.tables WHERE table_name = 'mainview_syscpc'`;
    const tableResult = await client.query(tableCheckQuery);
    const countQuery = `SELECT COUNT(*) as count FROM mainview_syscpc`;
    const countResult = await client.query(countQuery);
    client.release();
    res.status(200).json({ success: true, tableInfo: { exists: tableResult.rows.length > 0, rowCount: parseInt(countResult.rows[0].count) } });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ success: false, message: 'Tablo kontrolü başarısız', error: error.message });
  } finally { if (pool) await pool.end(); }
};
const getMainviewCmfSyscpc = async (req, res) => {
  let pool = null;
  try {
    const config = req.body && Object.keys(req.body).length > 0 ? req.body : DEFAULT_CONFIG.database;
    pool = new Pool(config);
    const client = await pool.connect();
    const query = `SELECT * FROM mainview_syscpc ORDER BY timestamp DESC LIMIT 100`;
    const result = await client.query(query);
    client.release();
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: 'Veriler getirilemedi', error: error.message });
  } finally { if (pool) await pool.end(); }
};

module.exports = {
  testConnection,
  getMainviewMvsSysover,
  getMainviewMvsJespool,
  checkTableExists,
  checkTableExistsJespool,
  getMainviewMvsJCPU,
  checkTableExistsJCPU,
  getLatestCpuData,
  checkTableExistsStacks,
  getMainviewNetworkStacks, 
  checkTableExistsStackCPU,
  getMainviewNetworkStackCPU,
  checkTableExistsVtamcsa,
  getMainviewNetworkVtamcsa,
  getMainviewNetworkTcpconf,
  checkTableExiststcpconf,
  getMainviewNetworktcpcons,
  checkTableExiststcpcons,
  getMainviewNetworkudpconf,
  checkTableExiststudpconf,
  getMainviewNetworkactcons,
  checkTableExistsactcons,
  getMainviewUSSZFS,
  checkTableExistsZFS,
  // NEW: Network tables (VTMBUFF, TCPSTOR, CONNSRPZ)
  checkTableExistsVtmbuff,
  getMainviewNetworkVtmbuff,
  checkTableExistsTcpstor,
  getMainviewNetworkTcpstor,
  checkTableExistsConnsrpz,
  getMainviewNetworkConnsrpz,
  // MQ tables
  checkTableExistsMQConnz,
  getMainviewMQConnz,
  checkTableExistsMQQm,
  getMainviewMQQm,
  checkTableExistsMQW2over,
  getMainviewMQW2over,
  // CSA Storage tables
  getMainviewStorageCsasum,
  checkTableExistsCsasum,
  getMainviewStorageFrminfoCenter,
  checkTableExistsFrminfoCenter,
  getMainviewStorageFrminfofixed,
  checkTableExistsFrminfoFixed,
  getMainviewStorageFrminfoHighVirtual,
  checkTableExistsFrminfoHighVirtual,
  getMainviewStoragesysfrmiz,
  checkTableExistsSysfrmiz,
  // RMF tables
  checkTableExistsRmfPgspp,
  getMainviewRmfPgspp,
  checkTableExistsRmfArd,
  getMainviewRmfArd,
  checkTableExistsRmfTrx,
  getMainviewRmfTrx,
  checkTableExistsRmfAsrm,
  getMainviewRmfAsrm,
  checkTableExistsRmfSrcs,
  getMainviewRmfSrcs,
  checkTableExistsRmfAsd,
  getMainviewRmfAsd,
  checkTableExistsRmfSpag,
  getMainviewRmfSpag,
  // CMF tables
  checkTableExistsCmfDspcz,
  getMainviewCmfDspcz,
  checkTableExistsCmfXcfsys,
  getMainviewCmfXcfsys,
  checkTableExistsCmfJcsa,
  getMainviewCmfJcsa,
  checkTableExistsCmfXcfmbr,
  getMainviewCmfXcfmbr,
  checkTableExistsCmfSyscpc,
  getMainviewCmfSyscpc
};