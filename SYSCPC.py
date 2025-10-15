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

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
syscpc_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SYSCPC/data"

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
        logging.FileHandler('mvs_monitoring.log', encoding='utf-8'),
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
    """Checks token expiry and refreshes if necessary"""
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

# ==================== SYSCPC API FUNCTIONS ==================== 

def create_syscpc_table():
    """Creates SYSCPC table if it doesn't exist"""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_syscpc (
            smf_id VARCHAR(50),
            system_name VARCHAR(100),
            hardware_name VARCHAR(100),
            cpu_model VARCHAR(100),
            cpc_capacity DECIMAL(15,2),
            base_cpc_capacity DECIMAL(15,2),
            capacity_on_demand VARCHAR(10),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    return execute_query(query)

def get_syscpc_data():
    """Fetches SYSCPC data from API"""
    token = check_and_refresh_token()
    if not token:
        return None
    
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(syscpc_url, headers=headers, params=params, verify=False, timeout=30)
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def extract_syscpc_fields(api_data):
    """Extracts required fields from SYSCPC API response"""
    if not api_data or 'Rows' not in api_data or not api_data['Rows']:
        return None
    
    row = api_data['Rows'][0]
    
    return {
        'smf_id': row.get('SYGID', ''),
        'system_name': row.get('SYXSYSN', ''),
        'hardware_name': row.get('SYGHDNM', ''),
        'cpu_model': row.get('SYGMODEL2', ''),
        'cpc_capacity': extract_numeric_from_api_list(row.get('SYGMSU', [0])),
        'base_cpc_capacity': extract_numeric_from_api_list(row.get('SYGBMSU', [0])),
        'capacity_on_demand': row.get('SYGOOCOD', '')
    }

def save_syscpc_to_db(data):
    """Saves SYSCPC data to PostgreSQL"""
    if not data:
        return False
    
    query = """
        INSERT INTO mainview_syscpc 
        (smf_id, system_name, hardware_name, cpu_model, cpc_capacity, base_cpc_capacity, capacity_on_demand, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
    """
    
    params = (
        data['smf_id'],
        data['system_name'], 
        data['hardware_name'],
        data['cpu_model'],
        data['cpc_capacity'],
        data['base_cpc_capacity'],
        data['capacity_on_demand']
    )
    
    return execute_query(query, params)

def monitor_syscpc():
    """Main SYSCPC monitoring function"""
    create_syscpc_table()
    
    api_data = get_syscpc_data()
    if not api_data:
        return False
    
    extracted_data = extract_syscpc_fields(api_data)
    if not extracted_data:
        return False
    
    if save_syscpc_to_db(extracted_data):
        save_to_json(extracted_data, 'mvs_sysover_log.json')
        return True
    return False

def run_hourly():
    """Runs SYSCPC monitoring every hour"""
    while True:
        try:
            monitor_syscpc()
            logger.info("SYSCPC monitoring completed, waiting 1 hour...")
            time.sleep(3600)  # 1 hour = 3600 seconds
        except KeyboardInterrupt:
            logger.info("SYSCPC monitoring stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in hourly monitoring: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

if __name__ == "__main__":
    run_hourly()
