import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json

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
JSON_LOG_FILE_VTAMCSA = "mainframe-monitoring-project/vtamcsa_log.json"

# -------------------
# Logging Configuration
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mainframe-monitoring-project/vtamcsa.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URLs
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
vtamcsa_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/VTAMCSA/data"


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

def get_first_value(list_field): #If there is a dict in the list, it returns the first value, otherwise it returns None.
            if isinstance(list_field, list) and len(list_field) > 0:
                first_item = list_field[0]
                if isinstance(first_item, dict):
                    return next(iter(first_item.values()), None)
                return first_item
            return None

# -------------------
# Table Creation
# -------------------
def vtamcsa_create_table(): # Creates VTAMCSA table # Creates ASRM table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_network_vtamcsa (
    id SERIAL PRIMARY KEY,
    J_SYSTEM TEXT,
    CSACUR BIGINT,
    CSAMAX BIGINT,
    CSALIM BIGINT,
    CSAUSAGE DOUBLE PRECISION,
    C24CUR BIGINT,
    C24MAX BIGINT,
    VTMCUR BIGINT,
    VTMMAX BIGINT,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);
    """
    execute_query(create_query)
    print("✅ mainview_network_vtamcsa table ready")

# -------------------
# Database Write Functions
# -------------------
def vtamcsa_process_row(rows):
    if not isinstance(rows, list):
        print("⚠️ Beklenmedik API formatı: Rows bir liste değil.")
        return

    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # Liste olan alanlardan sadece ilk değer alınır

        j_system_value = get_first_value(row.get("J@SYSTEM", []))
        csacur_value = int(float(row.get("CSACUR", " ")))
        csamax_value = int(float(row.get("CSAMAX", " ")))
        csalim_value = int(float(row.get("CSALIM", " ")))
        csausage_value = float(row.get("CSAUSAGE", " ")) 
        c24cur_value = int(float(row.get("C24CUR", " ")))
        c24max_value = int(float(row.get("C24MAX", " ")))
        vtmcur_value = int(float(row.get("VTMCUR", " ")))
        vtmmax_value = int(float(row.get("VTMMAX", " ")))

        insert_query = """
    INSERT INTO mainview_network_vtamcsa (
        J_SYSTEM, CSACUR, CSAMAX, CSALIM, CSAUSAGE, C24CUR, C24MAX, VTMCUR, VTMMAX, bmctime, "time"
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

        params = (j_system_value, csacur_value, csamax_value, csalim_value, csausage_value, c24cur_value, c24max_value, vtmcur_value, vtmmax_value, bmctime, time_t)    

        if execute_query(insert_query, params):
            print(f"✅ Veri eklendi → VTAMCSA (UTC: {bmctime})")
        else:
            print(f"❌ Veri eklenemedi → VTAMCSA")


# -------------------
# Data Fetching Functions
# ------------------
def vtamcsa_display(): # Fetches VTAMCSA API response
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(vtamcsa_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("VTAMCSA DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(vtamcsa_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. VTAMCSA DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            vtamcsa_process_row(rows)
        else:
            print("⚠️ No rows received from API")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Logging Functions
# -------------------
def vtamcsa_save_json(): # Fetches VTAMCSA API response and saves all data to log file.
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    try:
        response = requests.get(vtamcsa_url, params=params, headers=headers, verify=False)
        if response.status_code == 401:
            logger.warning("VTAMCSA DB: 401 error. Token being refreshed and retrying.")
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(vtamcsa_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token could not be refreshed. VTAMCSA DB record being skipped.")
                return
        if response.status_code == 200:
            data = response.json()
            append_to_json_log(data, JSON_LOG_FILE_VTAMCSA)
        else:
            logger.error(f"VTAMCSA API error: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"VTAMCSA Request error: {e}")
        print(f"❌ Request error: {e}")

# -------------------
# Main Function
# -------------------
def main():
    vtamcsa_create_table()
    api_token = get_token()
    if not api_token:
        print("❌ Token could not be obtained. Terminating program.")
        return
    while True:
        vtamcsa_display()
        #vtamcsa_save_json()
        logger.info("Waiting 60 seconds for new data...")
        time.sleep(60) # Waits 1 minute

if __name__ == "__main__":
    main()  
