import psycopg2
import requests
import time
import json
import logging
from datetime import datetime, timedelta
import pytz
import urllib3
import threading
from concurrent.futures import ThreadPoolExecutor

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
tcpcons_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPCONS/data"
actcons_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/ACTCONS/data"
udpconf_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/UDPCONF/data"
tcpconf_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPCONF/data"
vtmbuff_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/VTMBUFF/data"
tcpstor_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPSTOR/data"
connrspz_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/CONNRSPZ/data"
vtamcsa_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/VTAMCSA/data"
stacks_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/STACKS/data"
stackcpu_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/STACKCPU/data"

# Global variables for API token management
api_token = None
token_expiry_time = None

# PostgreSQL connection information
POSTGRES_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678',
    'connect_timeout': 5
}

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('unified_monitoring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ==================== COMMON FUNCTIONS ====================

def get_postgres_connection():
    """Creates and returns PostgreSQL connection"""
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None):
    """Executes SQL query and returns result"""
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False        
        cursor = connection.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)        
        connection.commit()
        cursor.close()
        return True        
    except Exception as e:
        logger.error(f"Query error: {e}")
        try:
            logger.error(f"Query: {query}")
            logger.error(f"Parameters: {params}")
        except Exception:
            pass
        return False
    finally:
        if connection:
            connection.close()

def get_token_from_db():
    """Gets active token from database"""
    query = """
        SELECT token, expires_at
        FROM mv_api_tokens
        WHERE is_active = TRUE AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    """    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return None, None        
        cursor = connection.cursor()
        cursor.execute(query)
        result = cursor.fetchone()        
        if result:
            token, expires_at = result
            return token, expires_at
        else:
            return None, None          
    except Exception as e:
        logger.error(f"Token DB error: {e}")
        return None, None
    finally:
        if connection:
            connection.close()

def save_token_to_db(token, expires_at):
    """Saves new token to database"""
    # First deactivate old tokens
    deactivate_query = "UPDATE mv_api_tokens SET is_active = FALSE"
    execute_query(deactivate_query)  
    # Add new token
    insert_query = """
        INSERT INTO mv_api_tokens (token, expires_at, is_active)
        VALUES (%s, %s, TRUE)
    """    
    if execute_query(insert_query, (token, expires_at)):
        return True
    else:
        return False

def get_token():
    """Gets API token - DB integrated"""
    global api_token, token_expiry_time
    # First try to get token from DB
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # Check if DB token is still valid
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            return api_token    
    # If no valid token in DB, get new token
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1239"
    }    
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)    
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")          
            if new_token:
                # Calculate token duration (15 minutes)
                expires_at = datetime.now(pytz.UTC) + timedelta(minutes=15)                
                # Save to DB
                if save_token_to_db(new_token, expires_at):
                    api_token = new_token
                    token_expiry_time = expires_at
                    return api_token
                else:
                    return None
            else:
                return None
        else:
            return None            
    except requests.exceptions.RequestException as e:
        return None
    except ValueError as e:
        return None

def check_and_refresh_token():
    """Checks token expiry and refreshes if necessary"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        return get_token()
    return api_token


def extract_value_from_api_list(raw_data):
    """Extracts value from API format - gets '0' key from first dictionary in list"""
    if raw_data is None:
        return ''
    
    if isinstance(raw_data, (int, float)):
        return str(raw_data)
    
    if isinstance(raw_data, str):
        return raw_data
    
    elif isinstance(raw_data, list) and raw_data:
        first_item = raw_data[0]
        if isinstance(first_item, dict):
            try:
                # Get value from '0' key
                return str(first_item.get('0', ''))
            except (ValueError, TypeError):
                return ''
        try:
            # Convert directly if string or number
            return str(first_item)
        except (ValueError, TypeError):
            return ''
    
    elif isinstance(raw_data, dict):
        try:
            # Get value from '0' key
            return str(raw_data.get('0', ''))
        except (ValueError, TypeError):
            return ''
    
    return ''

def extract_numeric_from_api_list(raw_data):
    """Converts numeric values from API format to float"""
    if raw_data is None:
        return 0.0
    
    if isinstance(raw_data, (int, float)):
        return float(raw_data)
    
    if isinstance(raw_data, str):
        try:
            return float(raw_data)
        except (ValueError, TypeError):
            return 0.0
    
    elif isinstance(raw_data, list) and raw_data:
        first_item = raw_data[0]
        if isinstance(first_item, dict):
            try:
                # Get value from '0' key and convert to float
                value_str = first_item.get('0', '0')
                return float(value_str)
            except (ValueError, TypeError):
                return 0.0
        try:
            return float(first_item)
        except (ValueError, TypeError):
            return 0.0
    
    elif isinstance(raw_data, dict):
        try:
            # Get value from '0' key and convert to float
            value_str = raw_data.get('0', '0')
            return float(value_str)
        except (ValueError, TypeError):
            return 0.0
    
    return 0.0

def get_first_value(list_field):
    """If there is a dict in the list, it returns the first value, otherwise it returns None."""
    if isinstance(list_field, list) and len(list_field) > 0:
        first_item = list_field[0]
        if isinstance(first_item, dict):
            return next(iter(first_item.values()), None)
        return first_item
    return None

# ==================== TABLE CREATION FUNCTIONS ====================

def create_tcpcons_table():
    """Creates the mainview_network_tcpcons table for TCP Connections monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpcons (
            foreign_ip_address VARCHAR(45),          -- FIPADDSC (IPv4/IPv6)
            remote_port INTEGER,                     -- FPORT
            local_port INTEGER,                      -- LPORT
            application_name VARCHAR(50),            -- JOBN
            type_of_open VARCHAR(10),                -- CONNOPEN (Remote/Local)
            interval_bytes_in BIGINT,                -- BYTEID
            interval_bytes_out BIGINT,               -- BYTEOD
            connection_status VARCHAR(20),           -- STATE
            remote_host_name VARCHAR(255),           -- DNSNAME
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(foreign_ip_address, remote_port, local_port, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_tcpcons table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_tcpcons table")
        return False

def create_actcons_table():
    """Creates the mainview_network_actcons table for Active Connections monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_actcons (
            foreign_ip_address VARCHAR(45),          -- FIPADDSC (IPv4/IPv6)
            remote_port INTEGER,                     -- FPORT
            local_ip_address VARCHAR(45),            -- LIPADDSC (IPv4/IPv6)
            local_port INTEGER,                      -- LPORT
            application_name VARCHAR(50),            -- JOBN
            type_of_open VARCHAR(10),                -- CONNOPEN (Remote/Local)
            interval_bytes_in BIGINT,                -- BYTEID
            interval_bytes_out BIGINT,               -- BYTEOD
            connection_status VARCHAR(20),           -- STATE
            remote_host_name VARCHAR(255),           -- DNSNAME
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(foreign_ip_address, remote_port, local_ip_address, local_port, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_actcons table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_actcons table")
        return False

def create_udpconf_table():
    """Creates the mainview_udpconf table for UDP configuration monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_udpconf (
            job_name VARCHAR(50),                    -- CONFJOBN
            stack_name VARCHAR(50),                  -- CONFSTCK
            def_recv_bufsize BIGINT,                 -- UDPDEFRC (bytes)
            def_send_bufsize BIGINT,                 -- UDPDEFSN (bytes)
            check_summing VARCHAR(10),               -- CALUCSUM
            restrict_low_port VARCHAR(10),           -- UDPRLWPR
            udp_queue_limit INTEGER,                 -- UDPQUELM
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_name, stack_name, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_udpconf table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_udpconf table")
        return False

def create_tcpconf_table():
    """Creates the mainview_tcpconf table for TCP configuration monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpconf (
            job_name VARCHAR(50),                    -- CONFJOBN
            stack_name VARCHAR(50),                  -- CONFSTCK
            def_receive_bufsize BIGINT,              -- TCPDEFRC (bytes)
            def_send_bufsize BIGINT,                 -- TCPDEFSN (bytes)
            def_max_receive_bufsize BIGINT,          -- TCPDFMXR (bytes)
            maximum_queue_depth INTEGER,             -- SOMAXCON
            max_retran_time DECIMAL(10,3),           -- CALMAXRE (seconds)
            min_retran_time DECIMAL(10,3),           -- CALMINRE (seconds)
            roundtrip_gain DECIMAL(10,3),            -- CALROUND
            variance_gain DECIMAL(10,3),             -- CALVARIG
            variance_multiple DECIMAL(10,3),         -- CALVARIM
            default_keepalive INTEGER,               -- TCPDEFKE (minutes)
            delay_ack VARCHAR(10),                   -- TCPDLACK
            restrict_low_port VARCHAR(10),           -- TCPRLWPR
            send_garbage VARCHAR(10),                -- TCPSNDGB
            tcp_timestamp VARCHAR(10),               -- TCPTMSTP
            ttls VARCHAR(10),                        -- TCPTTLS
            finwait2time INTEGER,                    -- TCPFINWT (seconds)
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_name, stack_name, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_tcpconf table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_tcpconf table")
        return False

def create_vtmbuff_table():
    """Creates the mainview_network_vtmbuff table for VTMBUFF monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_vtmbuff (
            id SERIAL PRIMARY KEY,
            system_name VARCHAR(50),
            iobuf_size INT,
            iobuf_times_expanded INT,
            lpbuf_size INT,
            lpbuf_times_expanded INT,
            lfbuf_size INT,
            lfbuf_times_expanded INT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_vtmbuff table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_vtmbuff table")
        return False

def create_tcpstor_table():
    """Creates the mainview_network_tcpstor table for TCPSTOR monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpstor (
            id SERIAL PRIMARY KEY,
            step_name VARCHAR(50),
            system_name VARCHAR(50),
            ecsa_current BIGINT,
            ecsa_max BIGINT,
            ecsa_limit BIGINT,
            ecsa_free BIGINT,
            ecsa_modules BIGINT,
            private_current BIGINT,
            private_max BIGINT,
            private_limit BIGINT,
            private_free BIGINT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_tcpstor table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_tcpstor table")
        return False

def create_connrspz_table():
    """Creates the mainview_network_connrspz table for CONNRSPZ monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_connrspz (
            id SERIAL PRIMARY KEY,
            foreign_ip_address VARCHAR(50),
            active_conns INT,
            average_rtt_ms INT,
            max_rtt_ms INT,
            interval_bytes_in_sum BIGINT,
            interval_bytes_out_sum BIGINT,
            stack_name VARCHAR(50),
            remote_host_name VARCHAR,
            interval_duplicate_acks_sum INT,
            interval_retransmit_count_sum INT,
            total_conns INT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_connrspz table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_connrspz table")
        return False

def create_vtamcsa_table():
    """Creates the mainview_network_vtamcsa table for VTAMCSA monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_vtamcsa (
            id SERIAL PRIMARY KEY,
            j_system TEXT,
            csacur BIGINT,
            csamax BIGINT,
            csalim BIGINT,
            csausage DOUBLE PRECISION,
            c24cur BIGINT,
            c24max BIGINT,
            vtmcur BIGINT,
            vtmmax BIGINT,
            bmctime TIMESTAMP WITH TIME ZONE,
            time TIME WITHOUT TIME ZONE
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_vtamcsa table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_vtamcsa table")
        return False

def create_stacks_table():
    """Creates the mainview_network_stacks table for STACKS monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_stacks (
            id SERIAL PRIMARY KEY,
            jobnam8 VARCHAR,
            stepnam8 VARCHAR,
            jtarget TEXT,
            asid8 VARCHAR,
            mvslvlx8 VARCHAR,
            ver_rel VARCHAR,
            startc8 TIMESTAMP,
            ipaddrc8 VARCHAR,
            status18 VARCHAR,
            bmctime TIMESTAMP WITH TIME ZONE,
            time TIME WITHOUT TIME ZONE
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_stacks table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_stacks table")
        return False

def create_stackcpu_table():
    """Creates the mainview_network_stackcpu table for STACKCPU monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_stackcpu (
            id SERIAL PRIMARY KEY,
            statstks TEXT,
            ippktrcd INTEGER,
            ippktrtr DOUBLE PRECISION,
            ipoutred INTEGER,
            ipoutrtr DOUBLE PRECISION,
            bmctime TIMESTAMP WITH TIME ZONE,
            time TIME WITHOUT TIME ZONE
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_stackcpu table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_stackcpu table")
        return False

# ==================== DATA FETCHING FUNCTIONS ====================

def fetch_tcpcons_data():
    """Fetches TCP Connections data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for TCPCONS data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(tcpcons_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ TCPCONS data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching TCPCONS data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching TCPCONS data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching TCPCONS data: {e}")
        return None

def fetch_actcons_data():
    """Fetches Active Connections data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for ACTCONS data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(actcons_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ ACTCONS data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching ACTCONS data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching ACTCONS data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching ACTCONS data: {e}")
        return None

def fetch_udpconf_data():
    """Fetches UDP configuration data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for UDPCONF data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(udpconf_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ UDPCONF data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching UDPCONF data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching UDPCONF data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching UDPCONF data: {e}")
        return None

def fetch_tcpconf_data():
    """Fetches TCP configuration data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for TCPCONF data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(tcpconf_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ TCPCONF data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching TCPCONF data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching TCPCONF data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching TCPCONF data: {e}")
        return None

def fetch_vtmbuff_data():
    """Fetches VTMBUFF data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for VTMBUFF data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(vtmbuff_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ VTMBUFF data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching VTMBUFF data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching VTMBUFF data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching VTMBUFF data: {e}")
        return None

def fetch_tcpstor_data():
    """Fetches TCPSTOR data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for TCPSTOR data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(tcpstor_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ TCPSTOR data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching TCPSTOR data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching TCPSTOR data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching TCPSTOR data: {e}")
        return None

def fetch_connrspz_data():
    """Fetches CONNRSPZ data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for CONNRSPZ data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(connrspz_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ CONNRSPZ data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching CONNRSPZ data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching CONNRSPZ data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching CONNRSPZ data: {e}")
        return None

def fetch_vtamcsa_data():
    """Fetches VTAMCSA data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for VTAMCSA data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(vtamcsa_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ VTAMCSA data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching VTAMCSA data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching VTAMCSA data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching VTAMCSA data: {e}")
        return None

def fetch_stacks_data():
    """Fetches STACKS data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for STACKS data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(stacks_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ STACKS data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching STACKS data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching STACKS data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching STACKS data: {e}")
        return None

def fetch_stackcpu_data():
    """Fetches STACKCPU data from API"""
    if not check_and_refresh_token():
        logger.error("❌ No valid token available for STACKCPU data fetch")
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    
    try:
        response = requests.get(stackcpu_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ STACKCPU data fetched successfully from API")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, need to refresh")
            return 'reauth'
        logger.error(f"❌ HTTP error fetching STACKCPU data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Request error fetching STACKCPU data: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error fetching STACKCPU data: {e}")
        return None

# ==================== DATA SAVING FUNCTIONS ====================

def save_tcpcons_data(data):
    """Saves TCP Connections data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty TCPCONS data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No TCPCONS records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        
        # Prepare data for batch insert
        batch_data = []
        current_time = datetime.now()
        
        for record in records:
            # Extract TCP Connections parameters
            foreign_ip_address = extract_value_from_api_list(record.get('FIPADDSC', ''))
            remote_port = extract_numeric_from_api_list(record.get('FPORT', 0))
            local_port = extract_numeric_from_api_list(record.get('LPORT', 0))
            application_name = extract_value_from_api_list(record.get('JOBN', ''))
            type_of_open = extract_value_from_api_list(record.get('CONNOPEN', ''))
            interval_bytes_in = extract_numeric_from_api_list(record.get('BYTEID', 0))
            interval_bytes_out = extract_numeric_from_api_list(record.get('BYTEOD', 0))
            connection_status = extract_value_from_api_list(record.get('STATE', ''))
            remote_host_name = extract_value_from_api_list(record.get('DNSNAME', ''))
            system_name = extract_value_from_api_list(record.get('SYSTEM', ''))
            
            # Add to batch data
            batch_data.append((
                foreign_ip_address, int(remote_port), int(local_port),
                application_name, type_of_open, int(interval_bytes_in), int(interval_bytes_out),
                connection_status, remote_host_name, system_name, current_time, current_time
            ))
        
        # Batch upsert using executemany
        upsert_query = """
            INSERT INTO mainview_network_tcpcons (
                foreign_ip_address, remote_port, local_port,
                application_name, type_of_open, interval_bytes_in, interval_bytes_out,
                connection_status, remote_host_name, system_name, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (foreign_ip_address, remote_port, local_port, system_name) 
            DO UPDATE SET
                application_name = EXCLUDED.application_name,
                type_of_open = EXCLUDED.type_of_open,
                interval_bytes_in = EXCLUDED.interval_bytes_in,
                interval_bytes_out = EXCLUDED.interval_bytes_out,
                connection_status = EXCLUDED.connection_status,
                remote_host_name = EXCLUDED.remote_host_name,
                updated_at = EXCLUDED.updated_at
        """
        
        # Execute batch insert
        cursor.executemany(upsert_query, batch_data)
        records_added = len(batch_data)
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} TCPCONS records updated/inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving TCPCONS data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_actcons_data(data):
    """Saves Active Connections data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty ACTCONS data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No ACTCONS records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            # Extract Active Connections parameters
            foreign_ip_address = extract_value_from_api_list(record.get('FIPADDSC', ''))
            remote_port = extract_numeric_from_api_list(record.get('FPORT', 0))
            local_ip_address = extract_value_from_api_list(record.get('LIPADDSC', ''))
            local_port = extract_numeric_from_api_list(record.get('LPORT', 0))
            application_name = extract_value_from_api_list(record.get('JOBN', ''))
            type_of_open = extract_value_from_api_list(record.get('CONNOPEN', ''))
            interval_bytes_in = extract_numeric_from_api_list(record.get('BYTEID', 0))
            interval_bytes_out = extract_numeric_from_api_list(record.get('BYTEOD', 0))
            connection_status = extract_value_from_api_list(record.get('STATE', ''))
            remote_host_name = extract_value_from_api_list(record.get('DNSNAME', ''))
            system_name = extract_value_from_api_list(record.get('SYSTEM', ''))
            
            # Upsert data into database (update if exists, insert if not)
            upsert_query = """
                INSERT INTO mainview_network_actcons (
                    foreign_ip_address, remote_port, local_ip_address, local_port,
                    application_name, type_of_open, interval_bytes_in, interval_bytes_out,
                    connection_status, remote_host_name, system_name, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (foreign_ip_address, remote_port, local_ip_address, local_port, system_name) 
                DO UPDATE SET
                    application_name = EXCLUDED.application_name,
                    type_of_open = EXCLUDED.type_of_open,
                    interval_bytes_in = EXCLUDED.interval_bytes_in,
                    interval_bytes_out = EXCLUDED.interval_bytes_out,
                    connection_status = EXCLUDED.connection_status,
                    remote_host_name = EXCLUDED.remote_host_name,
                    updated_at = EXCLUDED.updated_at
            """
            
            current_time = datetime.now()
            values = (
                foreign_ip_address, int(remote_port), local_ip_address, int(local_port),
                application_name, type_of_open, int(interval_bytes_in), int(interval_bytes_out),
                connection_status, remote_host_name, system_name, current_time, current_time
            )
            
            cursor.execute(upsert_query, values)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} ACTCONS records updated/inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving ACTCONS data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_udpconf_data(data):
    """Saves UDP configuration data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty UDPCONF data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No UDPCONF records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            # Extract UDP configuration parameters
            job_name = record.get('CONFJOBN', '')
            stack_name = record.get('CONFSTCK', '')
            system_name = record.get('SYSTEM', '')
            
            # Extract numeric values using the helper function
            def_recv_bufsize = extract_numeric_from_api_list(record.get('UDPDEFRC', 0))
            def_send_bufsize = extract_numeric_from_api_list(record.get('UDPDEFSN', 0))
            udp_queue_limit = extract_numeric_from_api_list(record.get('UDPQUELM', 0))
            
            # Extract string values
            check_summing = record.get('CALUCSUM', '')
            restrict_low_port = record.get('UDPRLWPR', '')
            
            # Upsert data into database (update if exists, insert if not)
            upsert_query = """
                INSERT INTO mainview_network_udpconf (
                    job_name, stack_name, def_recv_bufsize, def_send_bufsize,
                    check_summing, restrict_low_port, udp_queue_limit, 
                    system_name, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (job_name, stack_name, system_name) 
                DO UPDATE SET
                    def_recv_bufsize = EXCLUDED.def_recv_bufsize,
                    def_send_bufsize = EXCLUDED.def_send_bufsize,
                    check_summing = EXCLUDED.check_summing,
                    restrict_low_port = EXCLUDED.restrict_low_port,
                    udp_queue_limit = EXCLUDED.udp_queue_limit,
                    updated_at = EXCLUDED.updated_at
            """
            
            current_time = datetime.now()
            values = (
                job_name, stack_name, int(def_recv_bufsize), int(def_send_bufsize),
                check_summing, restrict_low_port, int(udp_queue_limit), 
                system_name, current_time, current_time
            )
            
            cursor.execute(upsert_query, values)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} UDPCONF records updated/inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving UDPCONF data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_tcpconf_data(data):
    """Saves TCP configuration data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty TCPCONF data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No TCPCONF records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            # Extract TCP configuration parameters
            job_name = record.get('CONFJOBN', '')
            stack_name = record.get('CONFSTCK', '')
            system_name = record.get('SYSTEM', '')
            
            # Extract numeric values using the helper function
            def_receive_bufsize = extract_numeric_from_api_list(record.get('TCPDEFRC', 0))
            def_send_bufsize = extract_numeric_from_api_list(record.get('TCPDEFSN', 0))
            def_max_receive_bufsize = extract_numeric_from_api_list(record.get('TCPDFMXR', 0))
            maximum_queue_depth = extract_numeric_from_api_list(record.get('SOMAXCON', 0))
            max_retran_time = extract_numeric_from_api_list(record.get('CALMAXRE', 0))
            min_retran_time = extract_numeric_from_api_list(record.get('CALMINRE', 0))
            roundtrip_gain = extract_numeric_from_api_list(record.get('CALROUND', 0))
            variance_gain = extract_numeric_from_api_list(record.get('CALVARIG', 0))
            variance_multiple = extract_numeric_from_api_list(record.get('CALVARIM', 0))
            default_keepalive = extract_numeric_from_api_list(record.get('TCPDEFKE', 0))
            finwait2time = extract_numeric_from_api_list(record.get('TCPFINWT', 0))
            
            # Extract string values
            delay_ack = record.get('TCPDLACK', '')
            restrict_low_port = record.get('TCPRLWPR', '')
            send_garbage = record.get('TCPSNDGB', '')
            tcp_timestamp = record.get('TCPTMSTP', '')
            ttls = record.get('TCPTTLS', '')
            
            # Upsert data into database (update if exists, insert if not)
            upsert_query = """
                INSERT INTO mainview_network_tcpconf (
                    job_name, stack_name, def_receive_bufsize, def_send_bufsize,
                    def_max_receive_bufsize, maximum_queue_depth, max_retran_time,
                    min_retran_time, roundtrip_gain, variance_gain, variance_multiple,
                    default_keepalive, delay_ack, restrict_low_port, send_garbage,
                    tcp_timestamp, ttls, finwait2time, system_name, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (job_name, stack_name, system_name) 
                DO UPDATE SET
                    def_receive_bufsize = EXCLUDED.def_receive_bufsize,
                    def_send_bufsize = EXCLUDED.def_send_bufsize,
                    def_max_receive_bufsize = EXCLUDED.def_max_receive_bufsize,
                    maximum_queue_depth = EXCLUDED.maximum_queue_depth,
                    max_retran_time = EXCLUDED.max_retran_time,
                    min_retran_time = EXCLUDED.min_retran_time,
                    roundtrip_gain = EXCLUDED.roundtrip_gain,
                    variance_gain = EXCLUDED.variance_gain,
                    variance_multiple = EXCLUDED.variance_multiple,
                    default_keepalive = EXCLUDED.default_keepalive,
                    delay_ack = EXCLUDED.delay_ack,
                    restrict_low_port = EXCLUDED.restrict_low_port,
                    send_garbage = EXCLUDED.send_garbage,
                    tcp_timestamp = EXCLUDED.tcp_timestamp,
                    ttls = EXCLUDED.ttls,
                    finwait2time = EXCLUDED.finwait2time,
                    updated_at = EXCLUDED.updated_at
            """
            
            current_time = datetime.now()
            values = (
                job_name, stack_name, int(def_receive_bufsize), int(def_send_bufsize),
                int(def_max_receive_bufsize), int(maximum_queue_depth), float(max_retran_time),
                float(min_retran_time), float(roundtrip_gain), float(variance_gain), 
                float(variance_multiple), int(default_keepalive), delay_ack, restrict_low_port,
                send_garbage, tcp_timestamp, ttls, int(finwait2time), system_name, 
                current_time, current_time
            )
            
            cursor.execute(upsert_query, values)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} TCPCONF records updated/inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving TCPCONF data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_vtmbuff_data(data):
    """Saves VTMBUFF data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty VTMBUFF data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No VTMBUFF records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        def safe_int(value, default_value=0):
            try:
                if value is not None:
                    return int(str(value).replace(',', '').strip())
                return default_value
            except (ValueError, TypeError):
                return default_value
        
        for record in records:
            system_name_data = record.get("J@SYSTEM")
            system_name = system_name_data[0].get('0') if isinstance(system_name_data, list) and system_name_data else None
            iobuf_size = safe_int(record.get("IOBUFSZ"))
            iobuf_times_expanded = safe_int(record.get("IOTIMEX"))
            lpbuf_size = safe_int(record.get("LPBUFSZ"))
            lpbuf_times_expanded = safe_int(record.get("LPTIMEX"))
            lfbuf_size = safe_int(record.get("LFBUFSZ"))
            lfbuf_times_expanded = safe_int(record.get("LFTIMEX"))
            record_timestamp = datetime.now()

            insert_query = """
                INSERT INTO mainview_network_vtmbuff (
                    system_name, iobuf_size, iobuf_times_expanded, lpbuf_size,
                    lpbuf_times_expanded, lfbuf_size, lfbuf_times_expanded,
                    record_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                system_name, iobuf_size, iobuf_times_expanded, lpbuf_size,
                lpbuf_times_expanded, lfbuf_size, lfbuf_times_expanded,
                record_timestamp
            ))
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} VTMBUFF records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving VTMBUFF data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_tcpstor_data(data):
    """Saves TCPSTOR data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty TCPSTOR data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No TCPSTOR records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        def safe_bigint(value, default_value=0):
            try:
                if value is not None:
                    value = str(value).replace(',', '').strip()
                    if value.lower().endswith('k'):
                        return int(float(value[:-1]) * 1024)
                    elif value.lower().endswith('m'):
                        return int(float(value[:-1]) * 1024 * 1024)
                    elif value.lower().endswith('g'):
                        return int(float(value[:-1]) * 1024 * 1024 * 1024)
                    else:
                        return int(float(value))
                return default_value
            except (ValueError, TypeError):
                return default_value
        
        for record in records:
            step_name = record.get("STEPNAM8")
            system_name = record.get("J@SYSTEM")
            ecsa_current = safe_bigint(record.get("MVECSACR"))
            ecsa_max = safe_bigint(record.get("MVECSAMX"))
            ecsa_limit = safe_bigint(record.get("MVECSALM"))
            ecsa_free = safe_bigint(record.get("MVECSAFR"))
            ecsa_modules = safe_bigint(record.get("MVECSAMD"))
            private_current = safe_bigint(record.get("MVPVTCR"))
            private_max = safe_bigint(record.get("MVPVTMX"))
            private_limit = safe_bigint(record.get("MVPVTLM"))
            private_free = safe_bigint(record.get("MVPVTFR"))
            record_timestamp = datetime.now()

            insert_query = """
                INSERT INTO mainview_network_tcpstor (
                    step_name, system_name, ecsa_current, ecsa_max, ecsa_limit,
                    ecsa_free, ecsa_modules, private_current, private_max,
                    private_limit, private_free, record_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                step_name, system_name, ecsa_current, ecsa_max, ecsa_limit,
                ecsa_free, ecsa_modules, private_current, private_max,
                private_limit, private_free, record_timestamp
            ))
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} TCPSTOR records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving TCPSTOR data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_connrspz_data(data):
    """Saves CONNRSPZ data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty CONNRSPZ data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No CONNRSPZ records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        def safe_int(value, default_value=0):
            try:
                if value is not None:
                    return int(float(str(value).replace(',', '').strip()))
                return default_value
            except (ValueError, TypeError):
                return default_value

        def safe_bigint(value, default_value=0):
            try:
                if value is not None:
                    return int(float(str(value).replace(',', '').strip()))
                return default_value
            except (ValueError, TypeError):
                return default_value
        
        for record in records:
            foreign_ip_address = record.get("FIPADDSC", "UNKNOWN")
            state_data = record.get("STATE", [])
            active_conns = safe_int(state_data[0].get('0', 0) if isinstance(state_data, list) and len(state_data) > 0 else 0)
            rtt_data = record.get("RTT", [])
            average_rtt_ms = safe_int(rtt_data[0].get('0', 0) if isinstance(rtt_data, list) and len(rtt_data) > 0 else 0)
            max_rtt_ms = safe_int(rtt_data[1].get('1', 0) if isinstance(rtt_data, list) and len(rtt_data) > 1 else 0)
            interval_bytes_in_sum = safe_bigint(record.get("BYTEID"))
            interval_bytes_out_sum = safe_bigint(record.get("BYTEOD"))
            stack_name = record.get("STACKNM", "UNKNOWN")
            remote_host_name = record.get("DNSNAME", "UNKNOWN")
            interval_duplicate_acks_sum = safe_int(record.get("DUPAKD"))
            interval_retransmit_count_sum = safe_int(record.get("REXMTD"))
            fipaddlc_data = record.get("FIPADDLC", [])
            total_conns = safe_int(fipaddlc_data[1].get('1', 0) if isinstance(fipaddlc_data, list) and len(fipaddlc_data) > 1 else 0)
            record_timestamp = datetime.now()

            insert_query = """
                INSERT INTO mainview_network_connrspz (
                    foreign_ip_address, active_conns, average_rtt_ms, max_rtt_ms,
                    interval_bytes_in_sum, interval_bytes_out_sum, stack_name,
                    remote_host_name, interval_duplicate_acks_sum,
                    interval_retransmit_count_sum, total_conns, record_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                foreign_ip_address, active_conns, average_rtt_ms, max_rtt_ms,
                interval_bytes_in_sum, interval_bytes_out_sum, stack_name,
                remote_host_name, interval_duplicate_acks_sum,
                interval_retransmit_count_sum, total_conns,
                record_timestamp
            ))
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} CONNRSPZ records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving CONNRSPZ data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_vtamcsa_data(data):
    """Saves VTAMCSA data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty VTAMCSA data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No VTAMCSA records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            bmctime = datetime.now(pytz.UTC)
            time_t = datetime.now().replace(tzinfo=None, microsecond=0)

            # Extract only the first value from list fields
            j_system_value = get_first_value(record.get("J@SYSTEM", []))
            csacur_value = int(float(record.get("CSACUR", "0")))
            csamax_value = int(float(record.get("CSAMAX", "0")))
            csalim_value = int(float(record.get("CSALIM", "0")))
            csausage_value = float(record.get("CSAUSAGE", "0")) 
            c24cur_value = int(float(record.get("C24CUR", "0")))
            c24max_value = int(float(record.get("C24MAX", "0")))
            vtmcur_value = int(float(record.get("VTMCUR", "0")))
            vtmmax_value = int(float(record.get("VTMMAX", "0")))

            insert_query = """
                INSERT INTO mainview_network_vtamcsa (
                    j_system, csacur, csamax, csalim, csausage, c24cur, c24max, vtmcur, vtmmax, bmctime, time
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            params = (j_system_value, csacur_value, csamax_value, csalim_value, csausage_value, c24cur_value, c24max_value, vtmcur_value, vtmmax_value, bmctime, time_t)    

            cursor.execute(insert_query, params)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} VTAMCSA records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving VTAMCSA data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_stacks_data(data):
    """Saves STACKS data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty STACKS data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No STACKS records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            bmctime = datetime.now(pytz.UTC)
            time_t = datetime.now().replace(tzinfo=None, microsecond=0)

            jobnam8_value = record.get("JOBNAM8", "")
            stepnam8_value = record.get("STEPNAM8", "")
            jtarget_value = record.get("J@TARGET", "")
            asid8_value = record.get("ASID8", "")
            mvslvlx8_value = record.get("MVSLVLX8", "")
            ver_rel_value = record.get("VER_REL", "")
            startc8_value = record.get("STARTC8", "")
            ipaddrc8_value = record.get("IPADDRC8", "")
            status18_value = record.get("STATUS18", "")

            insert_query = """
                INSERT INTO mainview_network_stacks (
                   jobnam8, stepnam8, jtarget, asid8, mvslvlx8, ver_rel, startc8, ipaddrc8, status18,
                   bmctime, time
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            stacks_params = (
                jobnam8_value, stepnam8_value, jtarget_value, asid8_value, mvslvlx8_value, ver_rel_value, startc8_value, ipaddrc8_value, status18_value,
                bmctime, time_t
            )

            cursor.execute(insert_query, stacks_params)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} STACKS records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving STACKS data: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_stackcpu_data(data):
    """Saves STACKCPU data to database"""
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logger.warning("❌ Invalid or empty STACKCPU data received")
        return False
    
    records = data.get('Rows', [])
    if not records:
        logger.warning("❌ No STACKCPU records to process")
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        records_added = 0
        
        for record in records:
            bmctime = datetime.now(pytz.UTC)
            time_t = datetime.now().replace(tzinfo=None, microsecond=0)

            # Extract only the first value from list fields
            statstks_value = get_first_value(record.get("STATSTKS", []))
            ippktrcd_value = int(float(record.get("IPPKTRCD", 0)))
            ippktrtr_value = float(get_first_value(record.get("IPPKTRTR", [])) or 0)
            ipoutred_value = int(float(record.get("IPOUTRED", 0)))
            ipoutrtr_value = float(get_first_value(record.get("IPOUTRTR", [])) or 0)

            insert_query = """
                INSERT INTO mainview_network_stackcpu (
                    statstks, ippktrcd, ippktrtr, ipoutred, ipoutrtr, bmctime, time
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """

            params = (
                statstks_value,
                ippktrcd_value,
                ippktrtr_value,
                ipoutred_value,
                ipoutrtr_value,
                bmctime,
                time_t
            )

            cursor.execute(insert_query, params)
            records_added += 1
        
        connection.commit()
        cursor.close()
        logger.info(f"✅ {records_added} STACKCPU records inserted to database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving STACKCPU data: {e}")
        return False
    finally:
        if connection:
            connection.close()

# ==================== MONITORING FUNCTIONS ====================

def monitor_tcpcons():
    """Main monitoring function for TCP Connections"""
    logger.info("🚀 Starting TCPCONS monitoring service")
    
    # Create table if it doesn't exist
    if not create_tcpcons_table():
        logger.error("❌ Failed to create TCPCONS table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching TCPCONS data...")
            
            # Fetch data from API
            data = fetch_tcpcons_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_tcpcons_data()
            
            if data:
                # Save data to database
                if save_tcpcons_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ TCPCONS monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save TCPCONS data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch TCPCONS data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting TCPCONS monitoring.")
                break
            
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next TCPCONS monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 TCPCONS monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in TCPCONS monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_actcons():
    """Main monitoring function for Active Connections"""
    logger.info("🚀 Starting ACTCONS monitoring service")
    
    # Create table if it doesn't exist
    if not create_actcons_table():
        logger.error("❌ Failed to create ACTCONS table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching ACTCONS data...")
            
            # Fetch data from API
            data = fetch_actcons_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_actcons_data()
            
            if data:
                # Save data to database
                if save_actcons_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ ACTCONS monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save ACTCONS data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch ACTCONS data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting ACTCONS monitoring.")
                break
            
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next ACTCONS monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 ACTCONS monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in ACTCONS monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_udpconf():
    """Main monitoring function for UDP configuration"""
    logger.info("🚀 Starting UDPCONF monitoring service")
    
    # Create table if it doesn't exist
    if not create_udpconf_table():
        logger.error("❌ Failed to create UDPCONF table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching UDPCONF data...")
            
            # Fetch data from API
            data = fetch_udpconf_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_udpconf_data()
            
            if data:
                # Save data to database
                if save_udpconf_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ UDPCONF monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save UDPCONF data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch UDPCONF data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting UDPCONF monitoring.")
                break
            
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next UDPCONF monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 UDPCONF monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in UDPCONF monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_tcpconf():
    """Main monitoring function for TCP configuration"""
    logger.info("🚀 Starting TCPCONF monitoring service")
    
    # Create table if it doesn't exist
    if not create_tcpconf_table():
        logger.error("❌ Failed to create TCPCONF table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching TCPCONF data...")
            
            # Fetch data from API
            data = fetch_tcpconf_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_tcpconf_data()
            
            if data:
                # Save data to database
                if save_tcpconf_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ TCPCONF monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save TCPCONF data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch TCPCONF data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting TCPCONF monitoring.")
                break
            
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next TCPCONF monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 TCPCONF monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in TCPCONF monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_vtmbuff():
    """Main monitoring function for VTMBUFF"""
    logger.info("🚀 Starting VTMBUFF monitoring service")
    
    # Create table if it doesn't exist
    if not create_vtmbuff_table():
        logger.error("❌ Failed to create VTMBUFF table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching VTMBUFF data...")
            
            # Fetch data from API
            data = fetch_vtmbuff_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_vtmbuff_data()
            
            if data:
                # Save data to database
                if save_vtmbuff_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ VTMBUFF monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save VTMBUFF data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch VTMBUFF data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting VTMBUFF monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next VTMBUFF monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 VTMBUFF monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in VTMBUFF monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_tcpstor():
    """Main monitoring function for TCPSTOR"""
    logger.info("🚀 Starting TCPSTOR monitoring service")
    
    # Create table if it doesn't exist
    if not create_tcpstor_table():
        logger.error("❌ Failed to create TCPSTOR table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching TCPSTOR data...")
            
            # Fetch data from API
            data = fetch_tcpstor_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_tcpstor_data()
            
            if data:
                # Save data to database
                if save_tcpstor_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ TCPSTOR monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save TCPSTOR data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch TCPSTOR data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting TCPSTOR monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next TCPSTOR monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 TCPSTOR monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in TCPSTOR monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_connrspz():
    """Main monitoring function for CONNRSPZ"""
    logger.info("🚀 Starting CONNRSPZ monitoring service")
    
    # Create table if it doesn't exist
    if not create_connrspz_table():
        logger.error("❌ Failed to create CONNRSPZ table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching CONNRSPZ data...")
            
            # Fetch data from API
            data = fetch_connrspz_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_connrspz_data()
            
            if data:
                # Save data to database
                if save_connrspz_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ CONNRSPZ monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save CONNRSPZ data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch CONNRSPZ data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting CONNRSPZ monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next CONNRSPZ monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 CONNRSPZ monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in CONNRSPZ monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_vtamcsa():
    """Main monitoring function for VTAMCSA"""
    logger.info("🚀 Starting VTAMCSA monitoring service")
    
    # Create table if it doesn't exist
    if not create_vtamcsa_table():
        logger.error("❌ Failed to create VTAMCSA table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching VTAMCSA data...")
            
            # Fetch data from API
            data = fetch_vtamcsa_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_vtamcsa_data()
            
            if data:
                # Save data to database
                if save_vtamcsa_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ VTAMCSA monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save VTAMCSA data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch VTAMCSA data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting VTAMCSA monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next VTAMCSA monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 VTAMCSA monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in VTAMCSA monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_stacks():
    """Main monitoring function for STACKS"""
    logger.info("🚀 Starting STACKS monitoring service")
    
    # Create table if it doesn't exist
    if not create_stacks_table():
        logger.error("❌ Failed to create STACKS table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching STACKS data...")
            
            # Fetch data from API
            data = fetch_stacks_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_stacks_data()
            
            if data:
                # Save data to database
                if save_stacks_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ STACKS monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save STACKS data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch STACKS data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting STACKS monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next STACKS monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 STACKS monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in STACKS monitoring: {e}")
            error_count += 1
            time.sleep(30)

def monitor_stackcpu():
    """Main monitoring function for STACKCPU"""
    logger.info("🚀 Starting STACKCPU monitoring service")
    
    # Create table if it doesn't exist
    if not create_stackcpu_table():
        logger.error("❌ Failed to create STACKCPU table. Exiting.")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("=" * 50)
            logger.info("📊 Fetching STACKCPU data...")
            
            # Fetch data from API
            data = fetch_stackcpu_data()
            
            if data == 'reauth':
                logger.info("🔄 Token expired, refreshing...")
                if not get_token():
                    logger.error("❌ Failed to refresh token")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Max errors reached. Exiting.")
                        break
                    time.sleep(30)
                    continue
                data = fetch_stackcpu_data()
            
            if data:
                # Save data to database
                if save_stackcpu_data(data):
                    error_count = 0  # Reset error count on success
                    logger.info("✅ STACKCPU monitoring cycle completed successfully")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to save STACKCPU data (error count: {error_count})")
            else:
                error_count += 1
                logger.error(f"❌ Failed to fetch STACKCPU data (error count: {error_count})")
            
            # Check if max errors reached
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached. Exiting STACKCPU monitoring.")
                break
            
            # Wait 60 seconds before next cycle
            logger.info("⏳ Waiting 60 seconds for next STACKCPU monitoring cycle...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 STACKCPU monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error in STACKCPU monitoring: {e}")
            error_count += 1
            time.sleep(30)

# ==================== UNIFIED MONITORING ORCHESTRATOR ====================

def run_unified_monitoring():
    """Runs all monitoring services in parallel threads"""
    logger.info("🚀 Starting Unified Network Monitoring Service")
    logger.info("📋 Monitoring Services:")
    logger.info("   • TCPCONS - TCP Connections")
    logger.info("   • ACTCONS - Active Connections") 
    logger.info("   • UDPCONF - UDP Configuration")
    logger.info("   • TCPCONF - TCP Configuration")
    logger.info("   • VTMBUFF - Virtual Terminal Buffer")
    logger.info("   • TCPSTOR - TCP Storage")
    logger.info("   • CONNRSPZ - Connection Response Zone")
    logger.info("   • VTAMCSA - Virtual Terminal Access Method CSA")
    logger.info("   • STACKS - Network Stacks")
    logger.info("   • STACKCPU - Stack CPU Usage")
    logger.info("⏰ Monitoring interval: 60 seconds")
    logger.info("💾 Data will be saved to respective database tables")
    logger.info("\n💡 Press Ctrl+C to stop all monitoring services")
    
    # Create all tables first
    logger.info("🔧 Creating database tables...")
    create_tcpcons_table()
    create_actcons_table()
    create_udpconf_table()
    create_tcpconf_table()
    create_vtmbuff_table()
    create_tcpstor_table()
    create_connrspz_table()
    create_vtamcsa_table()
    create_stacks_table()
    create_stackcpu_table()
    
    # Start all monitoring services in separate threads
    with ThreadPoolExecutor(max_workers=10) as executor:
        try:
            # Submit all monitoring functions
            futures = {
                'tcpcons': executor.submit(monitor_tcpcons),
                'actcons': executor.submit(monitor_actcons),
                'udpconf': executor.submit(monitor_udpconf),
                'tcpconf': executor.submit(monitor_tcpconf),
                'vtmbuff': executor.submit(monitor_vtmbuff),
                'tcpstor': executor.submit(monitor_tcpstor),
                'connrspz': executor.submit(monitor_connrspz),
                'vtamcsa': executor.submit(monitor_vtamcsa),
                'stacks': executor.submit(monitor_stacks),
                'stackcpu': executor.submit(monitor_stackcpu)
            }
            
            logger.info("✅ All monitoring services started successfully")
            
            # Wait for all services to complete (they run indefinitely until interrupted)
            for service_name, future in futures.items():
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"❌ {service_name.upper()} monitoring service failed: {e}")
                    
        except KeyboardInterrupt:
            logger.info("🛑 Stopping all monitoring services...")
            # Cancel all running futures
            for future in futures.values():
                future.cancel()
            logger.info("✅ All monitoring services stopped")

def main():
    """Main function to start unified monitoring"""
    try:
        run_unified_monitoring()
    except KeyboardInterrupt:
        logger.info("🛑 Unified monitoring service stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error in unified monitoring service: {e}")

if __name__ == "__main__":
    main()
