import psycopg2
import requests
import time
import json
import threading
import os
import logging
from psycopg2 import sql
from datetime import datetime, timedelta, timezone
import pytz
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==================== CONFIGURATION ====================

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
jdelay_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/views/ASG"

# Global variables
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

# Database table names
TABLE_JDELAY = "mainview_mvs_jdelay"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mvs_monitoring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ANSI Color codes
ANSI_GREEN = "\x1b[32m"
ANSI_BLUE = "\x1b[34m"
ANSI_YELLOW = "\x1b[33m"
ANSI_RED = "\x1b[31m"
ANSI_WHITE = "\x1b[37m"
ANSI_RESET = "\x1b[0m"

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
        "password": "OZAN1238"
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

def get_common_headers_and_params():
    """Returns common headers and parameters"""
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
    return headers, params

def check_and_refresh_token():
    """Checks token expiry and refreshes if needed"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        return get_token()
    return api_token

def save_to_json(data, filename):
    """Saves data to JSON file (append mode)"""
    try:
        # Read existing file (if exists)
        existing_data = []
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Add new data
        new_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": data
        }
        existing_data.append(new_entry)
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        return filename
    except Exception as e:
        return None

def extract_numeric_from_api_list(raw_list):
    """Converts numeric values from API list format to float"""
    if not isinstance(raw_list, list) or not raw_list:
        return 0.0
    first_item = raw_list[0]
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

def fetch_api_data(url, view_name):
    """Fetches data from API"""
    if not api_token:
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            return 'reauth'
        return None
    except requests.exceptions.RequestException as e:
        return None

# ==================== JOB DELAY MONITORING ====================

def create_jdelay_table():
    """Creates job delay monitoring table"""
    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS {TABLE_JDELAY} (
        
        jobname VARCHAR(255),
        jes_job_number VARCHAR(50),
        address_space_type VARCHAR(10),
        service_class_name VARCHAR(255),
        job_step_monitored VARCHAR(10),
        total_delay_percentage DECIMAL(5,2),
        main_delay_reason VARCHAR(255),
        cpu_delay_percentage DECIMAL(5,2),
        io_delay_percentage DECIMAL(5,2),
        storage_delay_percentage DECIMAL(5,2),
        enqueue_delay_percentage DECIMAL(5,2),
        srm_delay_percentage DECIMAL(5,2),
        subsystem_delay_percentage DECIMAL(5,2),
        idle_percentage DECIMAL(5,2),
        ecb_other_delay_percentage DECIMAL(5,2),
        job_elapsed_time VARCHAR(50),
        address_space_status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    return execute_query(create_table_query)

def get_jdelay_data():
    """Fetches job delay data from API"""
    if not check_and_refresh_token():
        logger.error("Token could not be obtained")
        return None
    
    # Job delay API endpoint (using JCPU view which contains ASG data)
    jdelay_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JCPU/data"
    
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(jdelay_url, headers=headers, params=params, verify=False, timeout=30)
        
        if response.status_code == 401:
            logger.warning("Token expired, refreshing...")
            if get_token():
                headers, params = get_common_headers_and_params()
                response = requests.get(jdelay_url, headers=headers, params=params, verify=False, timeout=30)
            else:
                return None
        
        if response.status_code == 200:
            api_data = response.json()
            logger.info(f"API response received: {len(api_data.get('Rows', []))} records")
            return api_data
        else:
            logger.error(f"API error: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"API connection error: {e}")
        return None

def process_jdelay_data(api_data):
    """Processes job delay data from API and saves to database"""
    if not api_data:
        logger.warning("No data received from API - api_data is empty")
        return False
    
    if 'Rows' not in api_data:
        logger.warning(f"No data received from API - 'Rows' key not found. Available keys: {list(api_data.keys())}")
        return False
    
    if not api_data['Rows']:
        logger.warning("No data received from API - Rows list is empty")
        return False
    
    processed_count = 0
    
    for record in api_data['Rows']:
        try:
            # Extract data fields (ASG data from JCPU view)
            jobname = record.get('ASGNAME', '')
            jes_job_number = record.get('ASGJBID', '')
            address_space_type = record.get('ASREYFLC', '')
            service_class_name = record.get('ASGCNMC', '')
            job_step_monitored = record.get('ASGJSFLY', '')
            
            # Available delay information from JCPU view
            cpu_delay_percentage = extract_numeric_from_api_list(record.get('ASIWCPP', [0]))
            
            
            total_delay_percentage =record.get('ASIDLYP', 0)
            main_delay_reason = record.get('ASIMDLC', '')
            io_delay_percentage = record.get('ASIIODP', 0)
            storage_delay_percentage = record.get('ASISTDP', 0)
            enqueue_delay_percentage =record.get('ASIEQWP', 0)
            srm_delay_percentage =record.get('ASISRMP', 0)
            subsystem_delay_percentage =record.get('ASISUBP', 0)
            idle_percentage =record.get('ASIIDLP', 0)
            ecb_other_delay_percentage =record.get('ASIUNKP', 0)
            
            
            job_elapsed_time = record.get('ASGJELT', '')
            address_space_status = record.get('ASGFL1C', '')
            
            # Save to database
            insert_query = f"""
                INSERT INTO {TABLE_JDELAY} (
                    jobname, jes_job_number, address_space_type, service_class_name,
                    job_step_monitored, total_delay_percentage, main_delay_reason,
                    cpu_delay_percentage, io_delay_percentage, storage_delay_percentage,
                    enqueue_delay_percentage, srm_delay_percentage, subsystem_delay_percentage,
                    idle_percentage, ecb_other_delay_percentage, job_elapsed_time,
                    address_space_status
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params = (
                jobname, jes_job_number, address_space_type, service_class_name,
                job_step_monitored, total_delay_percentage, main_delay_reason,
                cpu_delay_percentage, io_delay_percentage, storage_delay_percentage,
                enqueue_delay_percentage, srm_delay_percentage, subsystem_delay_percentage,
                idle_percentage, ecb_other_delay_percentage, job_elapsed_time,
                address_space_status
            )
            
            if execute_query(insert_query, params):
                processed_count += 1
            else:
                logger.error(f"Data could not be saved: {jobname}")
                
        except Exception as e:
            logger.error(f"Data processing error: {e}")
            continue
    
    logger.info(f"{processed_count} job delay records processed")
    return processed_count > 0

def monitor_jdelay():
    """Main job delay monitoring function"""
    logger.info("Starting job delay monitoring...")
    logger.info("NOTE: Currently collecting available ASG data from JCPU view only.")
    logger.info("Additional API views may be required for complete delay information.")
    
    # Create table
    if not create_jdelay_table():
        logger.error("Job delay table could not be created")
        return
    
    logger.info("Job delay monitoring started - will run every 60 seconds")
    
    while True:
        try:
            logger.info("Fetching job delay data...")
            
            # Get data from API
            api_data = get_jdelay_data()
            
            if api_data:
                # Process and save data
                if process_jdelay_data(api_data):
                    logger.info(f"{ANSI_GREEN}Job delay data processed successfully{ANSI_RESET}")
                else:
                    logger.warning(f"{ANSI_YELLOW}Job delay data could not be processed{ANSI_RESET}")
            else:
                logger.error(f"{ANSI_RED}Job delay data could not be retrieved{ANSI_RESET}")
            
            # Wait 60 seconds
            logger.info("Waiting 60 seconds...")
            time.sleep(60)
            
        except KeyboardInterrupt:
            logger.info("Job delay monitoring stopped")
            break
        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            time.sleep(60)  # Wait 60 seconds even in case of error

# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    monitor_jdelay()