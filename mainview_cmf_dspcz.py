import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json
import os

#USING MANY QUERY

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# -------------------
# Global Constants and PostgreSQL Connection Settings
# -------------------
POSTGRES_CONFIG = {
    'host': '192.168.60.148',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678'
}

# Log File Names
JSON_LOG_FILE_DSPCZ = "mainframe-monitoring-project/dspcz_log.json"

# -------------------
# Logging Configuration
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mainframe-monitoring-project/dspcz.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URLs
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
dspcz_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/DSPCZ/data"


api_token = None
token_expiry_time = None

# -------------------
# Common Helper Functions
# -------------------
def get_postgres_connection(): # Creates PostgreSQL connection
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None): # Executes the given query
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
        return False
    finally:
        if connection:
            connection.close()

def get_token(): # Gets token
    global api_token, token_expiry_time
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {"username": "VOBA", "password": "OZAN1239"}
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")
            if new_token:
                api_token = new_token
                token_expiry_time = datetime.now(timezone.utc) + timedelta(minutes=15)
                print(f"✅ New token obtained")
                return api_token
        print(f"❌ Token could not be obtained. Status: {response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None

def get_common_headers_and_params(): # Creates headers and params with token
    headers = {'Authorization': f'Bearer {api_token}'}
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    return headers, params

def check_and_refresh_token(): # Refreshes token if expired
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(timezone.utc) >= token_expiry_time:
        print("🔄 Token expired, refreshing...")
        return get_token()
    return api_token

def extract_numeric_from_api_list(raw_list): # This function converts the single numeric value in the list (which may be in string or dict format) to float.
    # This function converts the single numeric value in the list (which may be in string or dict format) to float.
    if not isinstance(raw_list, list) or not raw_list:
        return 0.0
    first_item = raw_list[0]
    if isinstance(first_item, dict):
        try:
            # Tries to get the first value from the dictionary
            value_str = next(iter(first_item.values())) 
            return float(value_str)
        except (StopIteration, ValueError, TypeError):
            return 0.0
    try:
        # Converts if it's a direct string or number
        return float(first_item)
    except (ValueError, TypeError):
        return 0.0

def execute_many(query, data_list): # Adds multiple data to database at once using the given query
    if not data_list:
        print("Warning: No data found to write to database.")
        return False
        
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
            
        cursor = connection.cursor()
        cursor.executemany(query, data_list)
        connection.commit()
        cursor.close()
        logger.info(f"Total {len(data_list)} records successfully added to database.")
        return True
    except Exception as e:
        logger.error(f"Batch insert (executemany) error: {e}")
        if connection:
            connection.rollback()
        return False
    finally:
        if connection:
            connection.close()

def append_to_json_log(data_to_log, log_file): # Reads JSON file, adds new data and rewrites from beginning
    """ Reads existing JSON file, adds new data and rewrites from beginning (indent=4). """
    
    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data": data_to_log
    }

    logs = []
    try:
        # Read existing data
        with open(log_file, 'r', encoding='utf-8') as file:
            logs = json.load(file)
        if not isinstance(logs, list):
            # If it's valid JSON but not a list
            logs = [logs] 
    except (FileNotFoundError, json.JSONDecodeError):
        # If file doesn't exist or corrupted, reset
        logger.warning(f"{log_file} is being initialized or reset.")
        logs = []

    # Add new data to list
    logs.append(log_entry)
    
    # Rewrite entire list in readable format (indent=4)
    try:
        with open(log_file, 'w', encoding='utf-8') as file:
            json.dump(logs, file, ensure_ascii=False, indent=4)
        print(f"✅ Logging completed: {log_file}")
        logger.info(f"Logging completed: {log_file}")
    except Exception as e:
        logger.error(f"JSON file write error ({log_file}): {e}")

# -------------------
# Table Creation
# -------------------

def dspcz_create_table(): # Creates ASRM table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_cmf_dspcz (
    id SERIAL PRIMARY KEY,
    onam TEXT,
    dspname INTEGER,
    asid TEXT,
    key TEXT,
    typx TEXT,
    scox TEXT,
    refx TEXT,
    prox TEXT,
    csizavg NUMERIC,
    csizsum NUMERIC,
    msizavg NUMERIC,
    msizsum NUMERIC,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);

    """
    if execute_query(create_query):
        print("✅ mainview_cmf_dspcz table ready")
    else:
        print("❌ Table could not be created")

# -------------------
# Database Write Functions
# -------------------

def dspcz_process_row(rows): # Fetches FRMINFO_CENTRAL API response and writes to database
    if not isinstance(rows, list):
        logger.warning("Unexpected API format: Rows is not a list.")
        return False
    data_list = []
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        onam_value = row.get("ONAM", "")
        dspname_value = row.get("DSPNAME", "")
        asid_value = row.get("ASID", "")
        key_value = row.get("KEY", "")
        typx_value = row.get("TYPX", "")
        scox_value = row.get("SCOX", "")
        refx_value = row.get("REFX", "")
        prox_value = row.get("PROX", "")
        
        # Safely convert dspname to integer.

        csiz_list = row.get("CSIZ", [])
        msiz_list = row.get("MSIZ", [])

        csizavg_value = 0.0
        csizsum_value = 0.0
        msizavg_value = 0.0
        msizsum_value = 0.0
        
        # Liste boş değilse, elemanları tek tek fonksiyona gönder
        if len(csiz_list) > 0:
            csizavg_value = extract_numeric_from_api_list([csiz_list[0]]) # First list
        if len(csiz_list) > 1:
            csizsum_value = extract_numeric_from_api_list([csiz_list[1]]) # Listenin ikinci elemanını al
            
        if len(msiz_list) > 0:
            msizavg_value = extract_numeric_from_api_list([msiz_list[0]]) # Listenin ilk elemanını al
        if len(msiz_list) > 1:
            msizsum_value = extract_numeric_from_api_list([msiz_list[1]]) # Listenin ikinci elemanını al

        data_list.append((
            onam_value, dspname_value, asid_value, 
            key_value, typx_value, scox_value, refx_value, 
            prox_value, csizavg_value, csizsum_value, msizavg_value, 
            msizsum_value, bmctime, time_t
        ))
        
    if not data_list:
            logger.warning("No data to add found.")
            return False
        
    query = """
            INSERT INTO mainview_cmf_dspcz (
                onam, dspname, asid, key, typx, scox, refx, prox, csizavg, csizsum, msizavg, msizsum, bmctime, "time"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
    return execute_many(query, data_list)

# -------------------
# Data Fetching Functions
# ------------------
def dspcz_display(): # Fetches FRMINFO_CENTRAL API response
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(dspcz_url, params=params, headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("DSPCZ DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(dspcz_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. DSPCZ DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            dspcz_process_row(rows)
        else:
            print("⚠️ No rows received from API")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Logging Functions
# -------------------

def dspcz_save_json(): # Fetches FRMINFO_CENTRAL API response and saves all data to log file.
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    try:
        response = requests.get(dspcz_url, params=params, headers=headers, verify=False)
        if response.status_code == 401:
            logger.warning("DSPCZ DB: 401 error. Token being refreshed and retrying.")
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(dspcz_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token could not be refreshed. DSPCZ DB record being skipped.")
                return
        if response.status_code == 200:
            data = response.json()
            append_to_json_log(data, JSON_LOG_FILE_DSPCZ)
        else:
            logger.error(f"DSPCZ API error: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"DSPCZ Request error: {e}")
        print(f"❌ Request error: {e}")    

# -------------------
# Main Function
# -------------------

def main():
    global api_token
    dspcz_create_table() # Creates DSPCZ table
    api_token = get_token()
    if not api_token:
        logger.error("Token could not be obtained. Terminating program.")
        return
    logger.info("Program started - collecting data every 60 seconds.")
    while True: 
        dspcz_display() # Fetches DSPCZ API response
        #dspcz_save_json() # Creates JSON file
        logger.info("Waiting 300 seconds for new data...")
        time.sleep(300)  # 5 minute interval

if __name__ == "__main__":
    main()  