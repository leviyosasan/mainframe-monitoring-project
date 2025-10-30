import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json

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
JSON_LOG_FILE_CONNZ = "connz_log.json"

# -------------------
# Logging Configuration
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('connz.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URLs
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
connz_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMQS/views/CONNZ/data"


api_token = None
token_expiry_time = None

# -------------------
# Common Helper Functions
# -------------------
def get_postgres_connection():
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None):
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

def get_token():
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

def get_common_headers_and_params():
    headers = {'Authorization': f'Bearer {api_token}'}
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    return headers, params

def check_and_refresh_token():
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(timezone.utc) >= token_expiry_time:
        print("🔄 Token expired, refreshing...")
        return get_token()
    return api_token

def extract_numeric_from_api_list(raw_list):
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

def execute_many(query, data_list):
    # Adds multiple data to database at once using the given query
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

# -------------------
# Table Creation
# -------------------

def connz_create_table(): # Creates CONNZ table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mq_connz (
    id SERIAL PRIMARY KEY,
    connapltag VARCHAR,
    conninfotyp INTEGER,
    connasid VARCHAR,
    connapltxy VARCHAR,
    conntranid VARCHAR,
    conntaskno VARCHAR,
    connpsbnm VARCHAR,
    connoject VARCHAR,
    connqmgr VARCHAR,

    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);
    """
    if execute_query(create_query):
        print("✅ mainview_mq_connz table ready")
    else:
        print("❌ Table could not be created")

# -------------------
# Database Write Functions
# -------------------

def connz_process_row(rows): # Fetches CONNZ API response and writes to database
    if not isinstance(rows, list):
        logger.warning("Unexpected API format: Rows is not a list.")
        return False

    data_list = []
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        connapltag_value = row.get("CONNAPLTAG", "")

        conninfotyp_value = int(row.get("CONNINFOTYP", ""))
        
        connasid_value = row.get("CONNASID", "")

        connapltxy_value = row.get("CONNAPLTYX", "")

        conntranid_value = row.get("CONNTRANID", "")

        conntaskno_value = row.get("CONNTASKNO", "")

        connpsbnm_value = row.get("CONNPSBNM", "")

        connoject_value = row.get("CONNOBJECT", "")

        connqmgr_value = row.get("CONNQMGR", "")

        data_list.append((
            connapltag_value,
            conninfotyp_value,
            connasid_value,
            connapltxy_value,
            conntranid_value,
            conntaskno_value,
            connpsbnm_value,
            connoject_value,
            connqmgr_value,
            bmctime,
            time_t,
            
        ))

    if not data_list:
        logger.warning("No data to add found.")
        return False

    query = """
        INSERT INTO mainview_mq_connz (
            connapltag, conninfotyp, connasid, connapltxy, conntranid, conntaskno, connpsbnm, connoject, connqmgr, bmctime, "time"
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    return execute_many(query, data_list)

# -------------------
# Data Fetching Functions
# -------------------
def connz_display(): # Fetches CONNZ API response
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(connz_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("CONNZ DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(connz_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. CONNZ DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            connz_process_row(rows)
        else:
            print("⚠️ No rows received from API")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Logging Functions
# -------------------

def connz_save_json(): # Fetches CONNZ API response and saves all data to log file.
    """ Fetches CONNZ API response and saves all data to log file. """
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(connz_url, params=params, headers=headers, verify=False)
        
        if response.status_code == 401:
            logger.warning("CONNZ: 401 error. Token being refreshed and retrying.")
            api_token = get_token()
            if api_token:
                # Token refreshed, retry request
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(connz_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token could not be refreshed. CONNZ record being skipped.")
                return

        if response.status_code == 200:
            data = response.json()
            logger.info(f"✅ CONNZ API response received, saving to JSON file...")
            append_to_json_log(data, JSON_LOG_FILE_CONNZ)
        else:
            logger.error(f"CONNZ API error: {response.status_code}")
            print(f"❌ API Error: {response.status_code}")

    except requests.exceptions.RequestException as e:
        logger.error(f"CONNZ Request error: {e}")
        print(f"❌ Request error: {e}")

def append_to_json_log(data_to_log, log_file): # Creates JSON file
    logger.info(f"🔄 Starting JSON log append process for {log_file}")
    
    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data": data_to_log
    }
    
    logger.info(f"📝 Created log entry with timestamp: {log_entry['timestamp_utc']}")

    logs = []
    try:
        # Read existing data
        logger.info(f"📖 Attempting to read existing JSON file: {log_file}")
        with open(log_file, 'r', encoding='utf-8') as file:
            logs = json.load(file)
        if not isinstance(logs, list):
            # If it's valid JSON but not a list
            logs = [logs] 
        logger.info(f"📖 Successfully read {len(logs)} existing entries from {log_file}")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        # If file doesn't exist or corrupted, reset
        logger.warning(f"⚠️ {log_file} is being initialized or reset. Reason: {e}")
        logs = []

    # Add new data to list
    logs.append(log_entry)
    logger.info(f"📝 Added new entry. Total entries now: {len(logs)}")
    
    # Rewrite entire list in readable format (indent=4)
    try:
        logger.info(f"💾 Writing {len(logs)} entries to {log_file}")
        with open(log_file, 'w', encoding='utf-8') as file:
            json.dump(logs, file, ensure_ascii=False, indent=4)
        print(f"✅ Logging completed: {log_file}")
        logger.info(f"✅ Logging completed: {log_file} - {len(logs)} entries total")
    except Exception as e:
        print(f"❌ JSON file write error ({log_file}): {e}")
        logger.error(f"❌ JSON file write error ({log_file}): {e}")

# -------------------
# Main Function
# -------------------

def main():
    global api_token
    connz_create_table() # Creates CONNZ table
    api_token = get_token()
    if not api_token:
        logger.error("Token could not be obtained. Terminating program.")
        return

    logger.info("Program started - collecting data every 60 seconds.")
    
    while True:
        connz_display() # Fetches CONNZ API response
        #connz_save_json() # Creates JSON file
        logger.info("Waiting 60 seconds for new data...")
        time.sleep(60)  # 1 minute interval

if __name__ == "__main__":
    main()