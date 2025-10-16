import psycopg2
import requests
import time
import json
import logging
from datetime import datetime, timedelta
import pytz
import urllib3

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
tcpconf_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPCONF/data"

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
        logging.FileHandler('tcpconf_monitoring.log', encoding='utf-8'),
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

def save_to_json(data, filename):
    """Saves data to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return filename
    except Exception as e:
        logger.error(f"JSON save error: {e}")
        return None

def extract_numeric_from_api_list(raw_data):
    """Converts numeric values from API format to float"""
    if isinstance(raw_data, str):
        # Handle direct string values like '50.000000'
        try:
            return float(raw_data)
        except (ValueError, TypeError):
            return 0.0
    elif isinstance(raw_data, list) and raw_data:
        first_item = raw_data[0]
        if isinstance(first_item, dict):
            try:
                # Try to get first value from dictionary
                value_str = next(iter(first_item.values())) 
                return float(value_str)
            except (StopIteration, ValueError, TypeError):
                return 0.0
        try:
            # Convert directly if string or number
            return float(first_item)
        except (ValueError, TypeError):
            return 0.0
    return 0.0

# ==================== TCPCONF FUNCTIONS ====================    

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
        logger.info("✅ mainview_tcpconf table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_tcpconf table")
        return False

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
            
            # Save data to JSON file for backup
            if data:
                save_to_json(data, 'tcpconf_monitoring_data.json')
            
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

def main():
    """Main function to start TCPCONF monitoring"""
    logger.info("🚀 TCPCONF Monitoring Service Starting")
    logger.info("📋 Monitoring TCP configuration parameters:")
    logger.info("⏰ Monitoring interval: 60 seconds")
    logger.info("💾 Data will be saved to: mainview_tcpconf table")
    logger.info("📄 Backup data will be saved to: tcpconf_monitoring_data.json")
    logger.info("\n💡 Press Ctrl+C to stop monitoring")
    
    try:
        monitor_tcpconf()
    except KeyboardInterrupt:
        logger.info("🛑 TCPCONF monitoring service stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error in TCPCONF monitoring service: {e}")

if __name__ == "__main__":
    main()

