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
tcpcons_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPCONS/data"

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
        logging.FileHandler('tcpcons_monitoring.log', encoding='utf-8'),
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

# ==================== TCPCONS FUNCTIONS ==================== 

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
            
            # Save data to JSON file for backup
            if data:
                save_to_json(data, 'tcpcons_monitoring_data.json')
            
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

def main():
    """Main function to start TCPCONS monitoring"""
    logger.info("🚀 TCPCONS Monitoring Service Starting")
    logger.info("⏰ Monitoring interval: 60 seconds")
    logger.info("💾 Data will be saved to: mainview_network_tcpcons table")
    logger.info("📄 Backup data will be saved to: tcpcons_monitoring_data.json")
    logger.info("\n💡 Press Ctrl+C to stop monitoring")
    
    try:
        monitor_tcpcons()
    except KeyboardInterrupt:
        logger.info("🛑 TCPCONS monitoring service stopped by user")
    except Exception as e:
        logger.error(f"❌ Fatal error in TCPCONS monitoring service: {e}")

if __name__ == "__main__":
    main()