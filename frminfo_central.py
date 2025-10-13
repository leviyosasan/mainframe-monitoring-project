import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json
import os

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# -------------------
# Global Constants and PostgreSQL Connection Settings
# -------------------
POSTGRES_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678'
}

# Log File Names
JSON_LOG_FILE_CENTRAL = "mainframe-monitoring-project/frminfo_central_log.json"

# -------------------
# Logging Configuration
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mainframe-monitoring-project/frminfo_central.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URLs
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
frminfo_central_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/FRMINFO/data"


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
    data = {"username": "VOBA", "password": "OZAN1238"}
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
def frminfo_central_create_table(): # Creates FRMINFO_CENTRAL table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_frminfo_central (
        id SERIAL PRIMARY KEY,
        spispcav NUMERIC,
        spispcmn NUMERIC,
        spispcmx NUMERIC,
        spilpfav NUMERIC,
        spilpfmn NUMERIC,
        spilpfmx NUMERIC,
        spicpfav NUMERIC,
        spicpfmn NUMERIC,
        spicpfmx NUMERIC,
        spiqpcav NUMERIC,
        spiqpcmn NUMERIC,
        spiqpcmx NUMERIC,
        spiapfav NUMERIC,
        spiapfmn NUMERIC,
        spiapfmx NUMERIC,
        spiafcav NUMERIC,
        spiafcmn NUMERIC,
        spitfuav NUMERIC,
        spiafumn NUMERIC,
        spiafumx NUMERIC,
        spitcpct NUMERIC,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    if execute_query(create_query):
        print("✅ mainview_frminfo_central table ready")
    else:
        print("❌ Table could not be created")

# -------------------
# Database Write Functions
# -------------------
def frminfo_central_process_row(rows): # Fetches FRMINFO_CENTRAL API response and writes to database
    if not isinstance(rows, list):
        logger.warning("Unexpected API format: Rows is not a list.")
        return False
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        spispcav_value = float(row.get("SPISPCAV", 0))
        spispcmn_value = float(row.get("SPISPCMN", 0))
        spispcmx_value = float(row.get("SPISPCMX", 0))

        spilpfav_value = float(row.get("SPILPFAV", 0))
        spilpfmn_value = float(row.get("SPILPFMN", 0))
        spilpfmx_value = float(row.get("SPILPFMX", 0))

        spicpfav_value = float(row.get("SPICPFAV", 0))
        spicpfmn_value = float(row.get("SPICPFMN", 0))
        spicpfmx_value = float(row.get("SPICPFMX", 0))

        spiqpcav_value = float(row.get("SPIQPCAV", 0))
        spiqpcmn_value = float(row.get("SPIQPCMN", 0))
        spiqpcmx_value = float(row.get("SPIQPCMX", 0))

        spiapfav_value = float(row.get("SPIAPFAV", 0))
        spiapfmn_value = float(row.get("SPIAPFMN", 0))
        spiapfmx_value = float(row.get("SPIAPFMX", 0))

        spiafcav_value = float(row.get("SPIAFCAV", 0))
        spiafcmn_value = float(row.get("SPIAFCMN", 0))

        spitfuav_value = float(row.get("SPITFUAV", 0))
        spiafumn_value = float(row.get("SPIAFUMN", 0))
        spiafumx_value = float(row.get("SPIAFUMX", 0))

        spitcpct_value = float(row.get("SPITCPCT", 0))


        insert_query = """
            INSERT INTO mainview_frminfo_central (
                spispcav, spispcmn, spispcmx,
                spilpfav, spilpfmn, spilpfmx,
                spicpfav, spicpfmn, spicpfmx,
                spiqpcav, spiqpcmn, spiqpcmx,
                spiapfav, spiapfmn, spiapfmx,
                spiafcav, spiafcmn, spitfuav,
                spiafumn, spiafumx, spitcpct,
                bmctime, "time"
            ) VALUES (%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s)
        """

        frminfo_central_params = (
            spispcav_value, spispcmn_value, spispcmx_value,
            spilpfav_value, spilpfmn_value, spilpfmx_value, spicpfav_value,
            spicpfmn_value, spicpfmx_value, spiqpcav_value, spiqpcmn_value,
            spiqpcmx_value, spiapfav_value, spiapfmn_value, spiapfmx_value,
            spiafcav_value, spiafcmn_value, spitfuav_value, spiafumn_value,
            spiafumx_value, spitcpct_value,bmctime, time_t
        )

        if execute_query(insert_query, frminfo_central_params):
            print(f"✅ Data added → FRMINFO_CENTRAL (UTC: {bmctime})")
        else:
            print(f"❌ Data could not be added → FRMINFO_CENTRAL")

# -------------------
# Data Fetching Functions
# ------------------

def frminfo_central_display(): # Fetches FRMINFO_CENTRAL API response
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("FRMINFO_CENTRAL DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. FRMINFO_CENTRAL DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            frminfo_central_process_row(rows)
        else:
            print("⚠️ No rows received from API")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Logging Functions
# -------------------

def frminfo_central_save_json(): # Fetches FRMINFO_CENTRAL API response and saves all data to log file.
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    try:
        response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
        if response.status_code == 401:
            logger.warning("FRMINFO_CENTRAL DB: 401 error. Token being refreshed and retrying.")
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token could not be refreshed. FRMINFO_CENTRAL DB record being skipped.")
                return
        if response.status_code == 200:
            data = response.json()
            append_to_json_log(data, JSON_LOG_FILE_CENTRAL)
        else:
            logger.error(f"FRMINFO_CENTRAL API error: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"FRMINFO_CENTRAL Request error: {e}")
        print(f"❌ Request error: {e}")    


# -------------------
# Main Function
# -------------------

def main():
    global api_token
    frminfo_central_create_table() # Creates FRMINFO_CENTRAL table
    api_token = get_token()
    if not api_token:
        logger.error("Token could not be obtained. Terminating program.")
        return
    logger.info("Program started - collecting data every 60 seconds.")
    while True: 
        frminfo_central_display() # Fetches FRMINFO_CENTRAL API response
        #frminfo_central_save_json() # Creates JSON file
        logger.info("Waiting 60 seconds for new data...")
        time.sleep(60)  # 1 minute interval

if __name__ == "__main__":
    main()  