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
xcfmbr_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/XCFMBR/data"

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
        logging.FileHandler('xcfmbr_monitoring.log', encoding='utf-8'),
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

# ==================== XCFMBR SPECIFIC FUNCTIONS ====================

def create_xcfmbr_table():
    """Creates XCFMBR table in PostgreSQL"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_xcfmbr (
            
            system_name VARCHAR(50),
            group_name VARCHAR(50),
            member_name VARCHAR(50),
            job_name VARCHAR(50),
            percent_received_group_signals DECIMAL(10,2),
            percent_received_system_signals DECIMAL(10,2),
            percent_received_total_signals DECIMAL(10,2),
            percent_sent_group_signals DECIMAL(10,2),
            percent_sent_system_signals DECIMAL(10,2),
            percent_sent_total_signals DECIMAL(10,2),
            percent_group_signals DECIMAL(10,2),
            percent_system_signals DECIMAL(10,2),
            percent_total_signals DECIMAL(10,2),
            signals_received_by_member BIGINT,
            signals_sent_by_member BIGINT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    if execute_query(create_table_query):
        logger.info("XCFMBR table created successfully")
        return True
    else:
        logger.error("Failed to create XCFMBR table")
        return False

def fetch_xcfmbr_data():
    """Fetches XCFMBR data from API"""
    if not check_and_refresh_token():
        logger.error("Failed to get valid API token")
        return None
    
    headers = {'Authorization': f'Bearer {api_token}'}
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*',
        'many': 'XDGSNAM,XDGGRP,XDGMEM,XDDJNAM,XDIRGTP,XDIRSTP,XDIRTTP,XDISGTP,XDISSTP,XDISTTP,XDITGTP,XDITSTP,XDITTTP,XDIRCNT,XDISCNT,XDGSTAC'
    }
    
    try:
        response = requests.get(xcfmbr_url, headers=headers, params=params, verify=False, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if 'Rows' in data and data['Rows']:
                logger.info(f"Fetched {len(data['Rows'])} XCFMBR records")
                return data
            else:
                logger.warning("No data found in API response")
                return None
        else:
            logger.error(f"API request failed: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"API request error: {e}")
        return None

def process_xcfmbr_data(api_data):
    """Processes XCFMBR API data and maps to database fields"""
    if not api_data or 'Rows' not in api_data:
        return []
    
    records = api_data['Rows']
    processed_records = []
    
    for record in records:
        try:
            processed_record = {
                'system_name': extract_field_value(record, 'XDGSNAM'),
                'group_name': extract_field_value(record, 'XDGGRP'),
                'member_name': extract_field_value(record, 'XDGMEM'),
                'job_name': extract_field_value(record, 'XDDJNAM'),
                'percent_received_group_signals': extract_numeric_from_api_list(record.get('XDIRGTP', 0)),
                'percent_received_system_signals': extract_numeric_from_api_list(record.get('XDIRSTP', 0)),
                'percent_received_total_signals': extract_numeric_from_api_list(record.get('XDIRTTP', 0)),
                'percent_sent_group_signals': extract_numeric_from_api_list(record.get('XDISGTP', 0)),
                'percent_sent_system_signals': extract_numeric_from_api_list(record.get('XDISSTP', 0)),
                'percent_sent_total_signals': extract_numeric_from_api_list(record.get('XDISTTP', 0)),
                'percent_group_signals': extract_numeric_from_api_list(record.get('XDITGTP', 0)),
                'percent_system_signals': extract_numeric_from_api_list(record.get('XDITSTP', 0)),
                'percent_total_signals': extract_numeric_from_api_list(record.get('XDITTTP', 0)),
                'signals_received_by_member': int(extract_numeric_from_api_list(record.get('XDIRCNT', 0))),
                'signals_sent_by_member': int(extract_numeric_from_api_list(record.get('XDISCNT', 0))),
                'status': extract_field_value(record, 'XDGSTAC')
            }
            processed_records.append(processed_record)
        except Exception as e:
            logger.error(f"Error processing record: {e}")
            continue
    
    logger.info(f"Processed {len(processed_records)} XCFMBR records")
    return processed_records

def extract_field_value(record, field_name):
    """Extracts field value from API record"""
    field_data = record.get(field_name, [])
    if isinstance(field_data, list) and field_data:
        first_item = field_data[0]
        if isinstance(first_item, dict):
            # Handle dictionary format like {'0': 'VBT1'}
            return next(iter(first_item.values()), '')
        else:
            return str(first_item)
    elif isinstance(field_data, str):
        # Handle direct string values
        return field_data
    return ''

def save_xcfmbr_data_to_db(processed_data):
    """Saves processed XCFMBR data to database"""
    if not processed_data:
        logger.warning("No data to save")
        return False
    
    insert_query = """
        INSERT INTO mainview_xcfmbr (
            system_name, group_name, member_name, job_name,
            percent_received_group_signals, percent_received_system_signals, percent_received_total_signals,
            percent_sent_group_signals, percent_sent_system_signals, percent_sent_total_signals,
            percent_group_signals, percent_system_signals, percent_total_signals,
            signals_received_by_member, signals_sent_by_member, status
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        saved_count = 0
        
        for record in processed_data:
            try:
                cursor.execute(insert_query, (
                    record['system_name'],
                    record['group_name'],
                    record['member_name'],
                    record['job_name'],
                    record['percent_received_group_signals'],
                    record['percent_received_system_signals'],
                    record['percent_received_total_signals'],
                    record['percent_sent_group_signals'],
                    record['percent_sent_system_signals'],
                    record['percent_sent_total_signals'],
                    record['percent_group_signals'],
                    record['percent_system_signals'],
                    record['percent_total_signals'],
                    record['signals_received_by_member'],
                    record['signals_sent_by_member'],
                    record['status']
                ))
                saved_count += 1
            except Exception as e:
                logger.error(f"Error saving record: {e}")
                continue
        
        connection.commit()
        cursor.close()
        logger.info(f"Successfully saved {saved_count} XCFMBR records to database")
        return True
        
    except Exception as e:
        logger.error(f"Database save error: {e}")
        return False
    finally:
        if connection:
            connection.close()

def save_xcfmbr_data_to_json(processed_data):
    """Saves XCFMBR data to JSON file"""
    if not processed_data:
        return None
    
    filename = 'xcfmbr_monitoring_data.json'
    data_with_timestamp = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "data": processed_data
    }
    return save_to_json(data_with_timestamp, filename)

def xcfmbr_monitoring_cycle():
    """Single XCFMBR monitoring cycle"""
    try:
        # Fetch data from API
        api_data = fetch_xcfmbr_data()
        if not api_data:
            return False
        
        # Process data
        processed_data = process_xcfmbr_data(api_data)
        if not processed_data:
            return False
        
        # Save to database
        db_success = save_xcfmbr_data_to_db(processed_data)
        
        # Save to JSON
        save_xcfmbr_data_to_json(processed_data)
        
        if db_success:
            logger.info("XCFMBR monitoring cycle completed successfully")
            return True
        else:
            logger.error("XCFMBR monitoring cycle failed - database save unsuccessful")
            return False
            
    except Exception as e:
        logger.error(f"XCFMBR monitoring cycle error: {e}")
        return False

def run_xcfmbr_monitoring(interval_seconds=60):
    """Runs XCFMBR monitoring continuously"""
    logger.info(f"Starting XCFMBR monitoring - Interval: {interval_seconds} seconds")
    
    # Create table if not exists
    if not create_xcfmbr_table():
        logger.error("Failed to create XCFMBR table, exiting...")
        return
    
    cycle_count = 0
    
    while True:
        try:
            cycle_count += 1
            logger.info(f"XCFMBR Monitoring Cycle #{cycle_count}")
            
            success = xcfmbr_monitoring_cycle()
            if success:
                logger.info(f"Cycle #{cycle_count} completed successfully")
            else:
                logger.error(f"Cycle #{cycle_count} failed")
            
            # Wait for next cycle
            logger.info(f"Waiting {interval_seconds} seconds for next cycle...")
            time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            logger.info("XCFMBR monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error in monitoring loop: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    # Disable SSL warnings
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Run XCFMBR monitoring every 60 seconds
    run_xcfmbr_monitoring(interval_seconds=60)