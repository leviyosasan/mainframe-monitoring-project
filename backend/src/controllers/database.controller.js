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
    
    // Get all data from mainview_network_stacks table
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
      message: 'Stacks verileri başarıyla getirildi',
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

module.exports = {
  testConnection,
  getMainviewMvsSysover,
  getMainviewMvsJespool,
  checkTableExists,
  checkTableExistsJespool,
  getMainviewMvsJCPU,
  checkTableExistsJCPU,
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
  checkTableExistsactcons
};
