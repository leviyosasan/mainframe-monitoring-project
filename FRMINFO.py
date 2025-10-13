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
frmınfo_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/FRMINFO/data"

# Monitoring Configuration
MONITORING_INTERVAL_SECONDS = 60  # Monitoring interval in seconds (1 minute)
ERROR_RETRY_INTERVAL_SECONDS = 30  # Retry interval in case of error (30 seconds)

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

# ==================== FRMINFO API FUNCTIONS ====================

# Global variables for API token management
api_token = None
token_expiry_time = None

def fetch_api_data(url, view_name):
    """Fetches data from API"""
    try:
        # Check token and refresh if necessary
        if not check_and_refresh_token():
            logger.error(f"Token could not be obtained - {view_name}")
            return None
        
        headers, params = get_common_headers_and_params()
        
        # Disable SSL warnings
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        response = requests.get(url, headers=headers, params=params, verify=False, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"{view_name} API data successfully retrieved")
            return data
        else:
            logger.error(f"{view_name} API error: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"{view_name} API connection error: {e}")
        return None
    except Exception as e:
        logger.error(f"{view_name} API general error: {e}")
        return None

def create_fixed_table():
    """Creates FRMINFO Fixed table - Organized Structure"""
    # First drop table (if exists)
    drop_table_query = "DROP TABLE IF EXISTS mainview_frminfo_fixed;"
    execute_query(drop_table_query)
    
    create_table_query = """
    CREATE TABLE mainview_frminfo_fixed (
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        system_name VARCHAR(100),
        server_name VARCHAR(100),
        
        -- SQA Frames (Average, Minimum, Maximum)
        sqa_avg FLOAT,
        sqa_min FLOAT,
        sqa_max FLOAT,
        
        -- LPA Frames (Average, Minimum, Maximum)
        lpa_avg FLOAT,
        lpa_min FLOAT,
        lpa_max FLOAT,
        
        -- CSA Frames (Average, Minimum, Maximum)
        csa_avg FLOAT,
        csa_min FLOAT,
        csa_max FLOAT,
        
        -- LSQA Frames (Average, Minimum, Maximum)
        lsqa_avg FLOAT,
        lsqa_min FLOAT,
        lsqa_max FLOAT,
        
        -- Private Frames (Average, Minimum, Maximum)
        private_avg FLOAT,
        private_min FLOAT,
        private_max FLOAT,
        
        -- Fixed <16M (Average, Minimum, Maximum)
        fixed_16m_avg FLOAT,
        fixed_16m_min FLOAT,
        fixed_16m_max FLOAT,
        
        -- Fixed Total (Average, Minimum, Maximum)
        fixed_total_avg FLOAT,
        fixed_total_min FLOAT,
        fixed_total_max FLOAT,
        
        -- Fixed Frames Percentage
        fixed_percentage FLOAT
    );
    """
    
    if execute_query(create_table_query):
        logger.info("FRMINFO Fixed table created (Organized Structure)")
        return True
    else:
        logger.error("FRMINFO Fixed table could not be created")
        return False

def create_high_virtual_table():
    """Creates FRMINFO High Virtual table - Organized Structure"""
    # First drop table (if exists)
    drop_table_query = "DROP TABLE IF EXISTS mainview_frminfo_high_virtual;"
    execute_query(drop_table_query)
    
    create_table_query = """
    CREATE TABLE mainview_frminfo_high_virtual (
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        system_name VARCHAR(100),
        server_name VARCHAR(100),
        
        -- High Virtual Common (Average, Minimum, Maximum)
        hv_common_avg FLOAT,
        hv_common_min FLOAT,
        hv_common_max FLOAT,
        
        -- High Virtual Shared (Average, Minimum, Maximum)
        hv_shared_avg FLOAT,
        hv_shared_min FLOAT,
        hv_shared_max FLOAT
    );
    """
    
    if execute_query(create_table_query):
        logger.info("FRMINFO High Virtual table created (Organized Structure)")
        return True
    else:
        logger.error("FRMINFO High Virtual table could not be created")
        return False

def fetch_frmınfo_data():
    """Fetches data from FRMINFO API"""
    try:
        data = fetch_api_data(frmınfo_url, "FRMINFO")
        if data:
            logger.info(f"FRMINFO data retrieved from API. Data type: {type(data)}")
            if isinstance(data, dict):
                logger.info(f"FRMINFO API response keys: {list(data.keys())}")
                if 'Rows' in data:
                    logger.info(f"FRMINFO 'Rows' content: {len(data['Rows']) if isinstance(data['Rows'], list) else 'Not a list'}")
            # Save to JSON file
            save_to_json(data, 'frminfo_monitoring_data.json')
            return data
        else:
            logger.warning("FRMINFO data could not be retrieved from API")
        return None
    except Exception as e:
        logger.error(f"FRMINFO data retrieval error: {e}")
        return None

def save_frmınfo_to_db(data):
    """Saves FRMINFO Fixed data to PostgreSQL"""
    if not data:
        logger.error("FRMINFO data is None or empty")
        return False
    
    # Check if 'Rows' key exists in API response
    if 'Rows' not in data:
        logger.error(f"'Rows' key not found in FRMINFO data. Available keys: {list(data.keys()) if isinstance(data, dict) else 'Data is not dict'}")
        return False
    
    try:
        rows = data['Rows']
        if not rows:
            logger.warning("FRMINFO data is empty")
            return False
        
        for row in rows:
            # Get system and server information
            system_name = row.get('SYSNAME', 'UNKNOWN')
            server_name = row.get('SPGID', 'UNKNOWN')
            
            # SQA Frame Metrics - values come directly as strings
            sqa_avg = float(row.get('SPISFFAV', '0')) if row.get('SPISFFAV') else 0.0
            sqa_min = float(row.get('SPISFFMN', '0')) if row.get('SPISFFMN') else 0.0
            sqa_max = float(row.get('SPISFFMX', '0')) if row.get('SPISFFMX') else 0.0
            
            # LPA Frame Metrics
            lpa_avg = float(row.get('SPILFFAV', '0')) if row.get('SPILFFAV') else 0.0
            lpa_min = float(row.get('SPILFFMN', '0')) if row.get('SPILFFMN') else 0.0
            lpa_max = float(row.get('SPILFFMX', '0')) if row.get('SPILFFMX') else 0.0
            
            # CSA Frame Metrics
            csa_avg = float(row.get('SPICFFAV', '0')) if row.get('SPICFFAV') else 0.0
            csa_min = float(row.get('SPICFFMN', '0')) if row.get('SPICFFMN') else 0.0
            csa_max = float(row.get('SPICFFMX', '0')) if row.get('SPICFFMX') else 0.0
            
            # LSQA Frame Metrics
            lsqa_avg = float(row.get('SPIQFFAV', '0')) if row.get('SPIQFFAV') else 0.0
            lsqa_min = float(row.get('SPIQFFMN', '0')) if row.get('SPIQFFMN') else 0.0
            lsqa_max = float(row.get('SPIQFFMX', '0')) if row.get('SPIQFFMX') else 0.0
            
            # Private Frame Metrics
            private_avg = float(row.get('SPIRFFAV', '0')) if row.get('SPIRFFAV') else 0.0
            private_min = float(row.get('SPIRFFMN', '0')) if row.get('SPIRFFMN') else 0.0
            private_max = float(row.get('SPIRFFMX', '0')) if row.get('SPIRFFMX') else 0.0
            
            # Fixed <16M Frame Metrics
            fixed_16m_avg = float(row.get('SPIBFFAV', '0')) if row.get('SPIBFFAV') else 0.0
            fixed_16m_min = float(row.get('SPIBFFMN', '0')) if row.get('SPIBFFMN') else 0.0
            fixed_16m_max = float(row.get('SPIBFFMX', '0')) if row.get('SPIBFFMX') else 0.0
            
            # Fixed Total Frame Metrics
            fixed_total_avg = float(row.get('SPITFFAV', '0')) if row.get('SPITFFAV') else 0.0
            fixed_total_min = float(row.get('SPITFFMN', '0')) if row.get('SPITFFMN') else 0.0
            fixed_total_max = float(row.get('SPITFFMX', '0')) if row.get('SPITFFMX') else 0.0
            
            # Fixed Frames Percentage
            fixed_percentage = float(row.get('SPITFPCT', '0')) if row.get('SPITFPCT') else 0.0
            
            # Save to database
            insert_query = """
                INSERT INTO mainview_frminfo_fixed (
                    system_name, server_name,
                    sqa_avg, sqa_min, sqa_max,
                    lpa_avg, lpa_min, lpa_max,
                    csa_avg, csa_min, csa_max,
                    lsqa_avg, lsqa_min, lsqa_max,
                    private_avg, private_min, private_max,
                    fixed_16m_avg, fixed_16m_min, fixed_16m_max,
                    fixed_total_avg, fixed_total_min, fixed_total_max,
                    fixed_percentage
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params = (
                system_name, server_name,
                sqa_avg, sqa_min, sqa_max,
                lpa_avg, lpa_min, lpa_max,
                csa_avg, csa_min, csa_max,
                lsqa_avg, lsqa_min, lsqa_max,
                private_avg, private_min, private_max,
                fixed_16m_avg, fixed_16m_min, fixed_16m_max,
                fixed_total_avg, fixed_total_min, fixed_total_max,
                fixed_percentage
            )
            
            if execute_query(insert_query, params):
                logger.info(f"FRMINFO Fixed data saved - {system_name}/{server_name} - SQA: {sqa_avg}, LPA: {lpa_avg}, CSA: {csa_avg}")
            else:
                logger.error(f"FRMINFO Fixed data could not be saved - {system_name}/{server_name}")
        
        return True
        
    except Exception as e:
        logger.error(f"FRMINFO Fixed DB save error: {e}")
        return False

def save_high_virtual_to_db(data):
    """Saves FRMINFO High Virtual data to PostgreSQL"""
    if not data:
        logger.error("FRMINFO High Virtual data is None or empty")
        return False
    
    # Check if 'Rows' key exists in API response
    if 'Rows' not in data:
        logger.error(f"'Rows' key not found in FRMINFO data. Available keys: {list(data.keys()) if isinstance(data, dict) else 'Data is not dict'}")
        return False
    
    try:
        rows = data['Rows']
        if not rows:
            logger.warning("FRMINFO High Virtual data is empty")
            return False
        
        for row in rows:
            # Get system and server information
            system_name = row.get('SYSNAME', 'UNKNOWN')
            server_name = row.get('SPGID', 'UNKNOWN')
            
            # High Virtual Common Frame Metrics
            high_virtual_common_avg = float(row.get('SPIHVCAV', '0')) if row.get('SPIHVCAV') else 0.0
            high_virtual_common_min = float(row.get('SPIHVCMN', '0')) if row.get('SPIHVCMN') else 0.0
            high_virtual_common_max = float(row.get('SPIHVCMX', '0')) if row.get('SPIHVCMX') else 0.0
            
            # High Virtual Shared Frame Metrics
            high_virtual_shared_avg = float(row.get('SPIHVSAV', '0')) if row.get('SPIHVSAV') else 0.0
            high_virtual_shared_min = float(row.get('SPIHVSMN', '0')) if row.get('SPIHVSMN') else 0.0
            high_virtual_shared_max = float(row.get('SPIHVSMX', '0')) if row.get('SPIHVSMX') else 0.0
            
            # Save to database
            insert_query = """
                INSERT INTO mainview_frminfo_high_virtual (
                    system_name, server_name,
                    hv_common_avg, hv_common_min, hv_common_max,
                    hv_shared_avg, hv_shared_min, hv_shared_max
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
            """
            
            params = (
                system_name, server_name,
                high_virtual_common_avg, high_virtual_common_min, high_virtual_common_max,
                high_virtual_shared_avg, high_virtual_shared_min, high_virtual_shared_max
            )
            
            if execute_query(insert_query, params):
                logger.info(f"FRMINFO High Virtual data saved - {system_name}/{server_name} - HVCommon: {high_virtual_common_avg}, HVShared: {high_virtual_shared_avg}")
            else:
                logger.error(f"FRMINFO High Virtual data could not be saved - {system_name}/{server_name}")
        
        return True
        
    except Exception as e:
        logger.error(f"FRMINFO High Virtual DB save error: {e}")
        return False

def monitor_frmınfo():
    """FRMINFO monitoring main function"""
    logger.info("FRMINFO monitoring starting...")
    
    # Create tables
    if not create_fixed_table():
        logger.error("Fixed table could not be created, stopping monitoring")
        return
    
    if not create_high_virtual_table():
        logger.error("High Virtual table could not be created, stopping monitoring")
        return
    
    while True:
        try:
            logger.info("Fetching FRMINFO data...")
            
            # Fetch data from API
            data = fetch_frmınfo_data()
            if data:
                # Save to both tables
                fixed_success = save_frmınfo_to_db(data)
                high_virtual_success = save_high_virtual_to_db(data)
                
                if fixed_success and high_virtual_success:
                    logger.info("FRMINFO monitoring cycle completed - Both tables updated")
                else:
                    logger.warning("FRMINFO monitoring cycle completed - Some tables could not be updated")
            else:
                logger.warning("FRMINFO data could not be retrieved")
            
            # Wait for monitoring interval
            logger.info(f"Waiting {MONITORING_INTERVAL_SECONDS} seconds until next monitoring cycle...")
            time.sleep(MONITORING_INTERVAL_SECONDS)
            
        except KeyboardInterrupt:
            logger.info("FRMINFO monitoring stopped")
            break
        except Exception as e:
            logger.error(f"FRMINFO monitoring error: {e}")
            logger.info(f"Retrying in {ERROR_RETRY_INTERVAL_SECONDS} seconds...")
            time.sleep(ERROR_RETRY_INTERVAL_SECONDS)

def main():
    """Main function"""
    try:
        logger.info("FRMINFO monitoring system starting...")
        logger.info(f"Monitoring interval: {MONITORING_INTERVAL_SECONDS} seconds")
        logger.info(f"Error retry interval: {ERROR_RETRY_INTERVAL_SECONDS} seconds")
        
        # Get token
        if not get_token():
            logger.error("Token could not be obtained, stopping system")
            return
        
        # Start monitoring
        monitor_frmınfo()
        
    except Exception as e:
        logger.error(f"Main function error: {e}")

if __name__ == "__main__":
    main()