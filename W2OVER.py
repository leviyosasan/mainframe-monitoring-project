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
w2over_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMQS/views/W2OVER/data"
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

# ==================== w2over FUNCTIONS ====================

def create_w2over_table():
    """Creates the mainview_mq_w2over table for WebSphere MQ monitoring"""
    create_query = """
        CREATE TABLE IF NOT EXISTS mainview_mq_w2over (
            
            queue_manager_name VARCHAR(50) UNIQUE,             -- WZOQMGR
            queue_manager_status VARCHAR(20),                  -- WZOQMST
            channels_retrying INTEGER,                         -- WZONRCHL
            local_queues_max_depth_high INTEGER,               -- WZOLQHI
            transmit_queues_max_depth_high INTEGER,            -- WZOXQHI
            dead_letter_message_count INTEGER,                 -- WZODLMCT
            free_pages_page_set_0_percent DECIMAL(5,2),       -- WZOPS0FP
            queue_manager_events_count INTEGER,                -- WZOEVTC
            event_listener_status VARCHAR(20),                 -- WZOEVTA
            command_server_status VARCHAR(20),                 -- WZOCMDSV
            command_prefix VARCHAR(50),                        -- WZOCPF
            reply_q_exceptions INTEGER,                        -- WZORQEXC
            record_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """
    if execute_query(create_query):
        logger.info("✅ mainview_mq_w2over table created successfully")
        return True
    else:
        logger.error("❌ mainview_mq_w2over table creation failed!")
        return False

def fetch_w2over_data():
    """Fetches W2OVER data from API"""
    if not check_and_refresh_token():
        logger.error("Token not found, W2OVER data cannot be fetched")
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
        response = requests.get(w2over_url, headers=headers, params=params, verify=False, timeout=30)
        response.raise_for_status()
        data = response.json()
        logger.info("✅ W2OVER data fetched successfully from API")
        logger.info(f"📊 API Response structure: {list(data.keys()) if isinstance(data, dict) else 'Not a dictionary'}")
        if isinstance(data, dict) and 'Rows' in data:
            logger.info(f"📊 Number of rows in response: {len(data.get('Rows', []))}")
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logger.warning("⚠️ Token expired, reauthentication will be performed")
            return 'reauth'
        logger.error(f"❌ W2OVER API HTTP error: {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ W2OVER data fetch error: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ W2OVER unexpected error: {e}")
        return None

def process_w2over_data(api_data):
    """Processes W2OVER API data and extracts metrics"""
    if not api_data:
        logger.warning("❌ Invalid W2OVER data received - no data")
        return []
    
    if 'Rows' not in api_data:
        logger.warning("❌ Invalid W2OVER data received - no 'Rows' key")
        logger.info(f"📊 Available keys in API response: {list(api_data.keys())}")
        return []
    
    records = api_data.get('Rows', [])
    if not records:
        logger.warning("❌ Invalid W2OVER data received - empty 'Rows' array")
        return []
    
    logger.info(f"📊 Processing {len(records)} W2OVER records from API")
    processed_records = []
    
    for i, record in enumerate(records):
        try:
            if i == 0:  # Log structure of first record for debugging
                logger.info(f"📊 First record fields: {list(record.keys()) if isinstance(record, dict) else 'Not a dictionary'}")
            
            # Extract each metric using the helper functions
            queue_manager_name = extract_value_from_api_list(record.get('WZOQMGR'))
            queue_manager_status = extract_value_from_api_list(record.get('WZOQMST'))
            channels_retrying = int(extract_numeric_from_api_list(record.get('WZONRCHL')))
            local_queues_max_depth_high = int(extract_numeric_from_api_list(record.get('WZOLQHI')))
            transmit_queues_max_depth_high = int(extract_numeric_from_api_list(record.get('WZOXQHI')))
            dead_letter_message_count = int(extract_numeric_from_api_list(record.get('WZODLMCT')))
            free_pages_page_set_0_percent = extract_numeric_from_api_list(record.get('WZOPS0FP'))
            queue_manager_events_count = int(extract_numeric_from_api_list(record.get('WZOEVTC')))
            event_listener_status = extract_value_from_api_list(record.get('WZOEVTA'))
            command_server_status = extract_value_from_api_list(record.get('WZOCMDSV'))
            command_prefix = extract_value_from_api_list(record.get('WZOCPF'))
            reply_q_exceptions = int(extract_numeric_from_api_list(record.get('WZORQEXC')))
            
            processed_record = {
                'queue_manager_name': queue_manager_name,
                'queue_manager_status': queue_manager_status,
                'channels_retrying': channels_retrying,
                'local_queues_max_depth_high': local_queues_max_depth_high,
                'transmit_queues_max_depth_high': transmit_queues_max_depth_high,
                'dead_letter_message_count': dead_letter_message_count,
                'free_pages_page_set_0_percent': free_pages_page_set_0_percent,
                'queue_manager_events_count': queue_manager_events_count,
                'event_listener_status': event_listener_status,
                'command_server_status': command_server_status,
                'command_prefix': command_prefix,
                'reply_q_exceptions': reply_q_exceptions
            }
            
            processed_records.append(processed_record)
            
        except Exception as e:
            logger.error(f"❌ W2OVER record processing error: {e}")
            continue
    
    logger.info(f"✅ {len(processed_records)} W2OVER records processed")
    return processed_records

def save_w2over_data(processed_data):
    """Saves processed W2OVER data to database"""
    if not processed_data:
        logger.warning("❌ No W2OVER data to save")
        return False
    
    connection = None
    cursor = None
    
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        
        upsert_query = """
            INSERT INTO mainview_mq_w2over (
                queue_manager_name, queue_manager_status, channels_retrying,
                local_queues_max_depth_high, transmit_queues_max_depth_high,
                dead_letter_message_count, free_pages_page_set_0_percent,
                queue_manager_events_count, event_listener_status,
                command_server_status, command_prefix, reply_q_exceptions,
                record_timestamp
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            ON CONFLICT (queue_manager_name) 
            DO UPDATE SET
                queue_manager_status = EXCLUDED.queue_manager_status,
                channels_retrying = EXCLUDED.channels_retrying,
                local_queues_max_depth_high = EXCLUDED.local_queues_max_depth_high,
                transmit_queues_max_depth_high = EXCLUDED.transmit_queues_max_depth_high,
                dead_letter_message_count = EXCLUDED.dead_letter_message_count,
                free_pages_page_set_0_percent = EXCLUDED.free_pages_page_set_0_percent,
                queue_manager_events_count = EXCLUDED.queue_manager_events_count,
                event_listener_status = EXCLUDED.event_listener_status,
                command_server_status = EXCLUDED.command_server_status,
                command_prefix = EXCLUDED.command_prefix,
                reply_q_exceptions = EXCLUDED.reply_q_exceptions,
                record_timestamp = EXCLUDED.record_timestamp
        """
        
        current_time = datetime.now()
        records_added = 0
        
        for record in processed_data:
            values = (
                record['queue_manager_name'],
                record['queue_manager_status'],
                record['channels_retrying'],
                record['local_queues_max_depth_high'],
                record['transmit_queues_max_depth_high'],
                record['dead_letter_message_count'],
                record['free_pages_page_set_0_percent'],
                record['queue_manager_events_count'],
                record['event_listener_status'],
                record['command_server_status'],
                record['command_prefix'],
                record['reply_q_exceptions'],
                current_time
            )
            
            cursor.execute(upsert_query, values)
            records_added += 1
        
        connection.commit()
        logger.info(f"✅ {records_added} W2OVER records updated/inserted to database successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ W2OVER database save error: {e}")
        if connection:
            connection.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def monitor_w2over():
    """Main W2OVER monitoring function"""
    logger.info("🚀 W2OVER monitoring starting...")
    
    # Create table if it doesn't exist
    if not create_w2over_table():
        logger.error("❌ W2OVER table not created, monitoring stopped")
        return
    
    # Get initial token
    if not get_token():
        logger.error("❌ First token not found, monitoring stopped")
        return
    
    error_count = 0
    max_errors = 5
    
    while True:
        try:
            logger.info("📊 W2OVER data fetching...")
            
            # Fetch data from API
            api_data = fetch_w2over_data()
            
            if api_data == 'reauth':
                logger.info("🔄 Token refreshing...")
                if not get_token():
                    logger.error("❌ Token refresh failed")
                    error_count += 1
                    if error_count >= max_errors:
                        logger.error("❌ Maximum error count reached, monitoring stopped")
                        break
                    time.sleep(60)
                    continue
                # Retry with new token
                api_data = fetch_w2over_data()
            
            if api_data:
                # Process the data
                processed_data = process_w2over_data(api_data)
                
                if processed_data:
                    # Save to database
                    if save_w2over_data(processed_data):
                        error_count = 0  # Reset error count on success
                        logger.info("✅ W2OVER monitoring loop completed successfully")
                    else:
                        error_count += 1
                        logger.error("❌ W2OVER data save error")
                else:
                    logger.warning("⚠️ No W2OVER data to process")
            else:
                error_count += 1
                logger.error("❌ W2OVER data not found from API")
            
            # Check error count
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached, monitoring stopped")
                break
            
            # Wait before next iteration (60 seconds)
            logger.info("⏳ Waiting 60 seconds...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("🛑 W2OVER monitoring stopped by user")
            break
        except Exception as e:
            error_count += 1
            logger.error(f"❌ W2OVER monitoring unexpected error: {e}")
            if error_count >= max_errors:
                logger.error("❌ Maximum error count reached, monitoring stopped")
                break
            time.sleep(60)

def main():
    """Main function to start W2OVER monitoring"""
    logger.info("🚀 WebSphere MQ W2OVER Monitoring Service")
    logger.info("\n💡 Press Ctrl+C to stop monitoring")
    
    try:
        monitor_w2over()
    except KeyboardInterrupt:
        logger.info("🛑 Monitoring stopped")
    except Exception as e:
        logger.error(f"❌ Monitoring error: {e}")

if __name__ == "__main__":
    main()

    