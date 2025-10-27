import requests
import time
import json
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# --- CONFIGURATION ---
CONFIG = {
    'database': {
        'host': "192.168.60.148",
        'port': 5432,
        'database': "mainview",
        'user': "postgres",
        'password': "12345678"
    },
    'api': {
        'username': "VOBA",
        'password': "OZAN1239"
    }
}

TABLE_NAME = "mainview_mq_qm" 

# --- API ENDPOINTS ---
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
QM_DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMQS/views/QM/data"

api_token = None
MAX_ERRORS = 5
error_count = 0
INTERVAL_SECONDS = 60

# --- DATABASE AND DATA UTILITIES ---

def safe_float(value: Any, default_value: Optional[float] = None) -> Optional[float]:
    """Safely converts rate values (e.g., QMIPUTTR) to float."""
    try:
        if value is not None and str(value).strip():
            return float(str(value).replace(',', '').strip())
        return default_value
    except (ValueError, TypeError):
        return default_value

def safe_int(value: Any, default_value: Optional[int] = None) -> Optional[int]:
    """Safely converts large count values (e.g., QMNQMES) to integers."""
    try:
        if value is not None and str(value).strip():
            # Convert to float first to handle scientific notation/string decimals robustly
            return int(float(str(value).replace(',', '').strip()))
        return default_value
    except (ValueError, TypeError):
        return default_value
        
def safe_extract_api_value(record: Dict[str, Any], api_key: str) -> Optional[Any]:
    """
    Safely extracts data from the API record, handling complex list-of-dict structures.
    """
    value = record.get(api_key)

    # Handle the list-of-dict format
    if isinstance(value, list) and value and isinstance(value[0], dict) and '0' in value[0]:
        return value[0].get('0')
            
    return value

def create_table_if_not_exists() -> bool:
    """
    Establishes DB connection and creates the Queue Manager table if it doesn't exist.
    DB schema is defined directly within this function.
    """
    conn = None
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        conn.autocommit = True 

        with conn.cursor() as cur:
            # Table Schema based on analyzed QM fields
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    
                    qmnames VARCHAR,
                    j_target VARCHAR,
                    qmplat VARCHAR,
                    qmplatn VARCHAR,
                    qmstat VARCHAR,
                    qmqstats VARCHAR,
                    qmcomlv VARCHAR,
                    
                    qmiputtr NUMERIC(10, 4), 
                    qmigetr NUMERIC(10, 4),  
                    
                    qnmqmes BIGINT,          
                    qmxqmes BIGINT,          

                    record_timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            
            cur.execute(create_query)
            
        logging.info(f"Table '{TABLE_NAME}' checked/created successfully.")
        return True
    except Exception as e:
        logging.error(f"FATAL DB ERROR: Could not establish connection or create table: {e}")
        return False
    finally:
        if conn: conn.close()
        
def get_db_connection() -> Optional[psycopg2.extensions.connection]:
    """Returns a new DB connection instance for data saving."""
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        return conn
    except Exception as e:
        logging.error(f"DB connection error during data insertion: {e}")
        return None

# --- API INTERACTIONS ---

def get_token() -> bool:
    """Retrieves the API authentication token."""
    global api_token
    logging.info("--- TOKEN ACQUISITION ---")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": CONFIG['api']['username'],
        "password": CONFIG['api']['password']
    }
    try:
        response = requests.post(LOGON_URL, headers=headers, data=data, timeout=10)
        response.raise_for_status()
        new_token = response.json().get("userToken")
        if new_token:
            api_token = new_token
            logging.info("Token successfully obtained.")
            return True
        else:
            logging.error("Token not found in API response. Raw response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Request failed during token retrieval: {e}")
        return False
    except ValueError as e:
        logging.error(f"JSON parsing failed during token retrieval: {e}")
        return False

def fetch_qm_data() -> Optional[Dict[str, Any]]:
    """Fetches 'QM' view data from the API."""
    if not api_token:
        logging.error("Cannot fetch QM data without an API token.")
        return None
        
    headers = {'Authorization': 'Bearer ' + api_token}
    try:
        response = requests.get(QM_DATA_URL, headers=headers, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info("QM data successfully fetched from API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"QM API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"QM data fetching failed: {e}")
        return None

def save_qm_data_to_db(data: Dict[str, Any]) -> bool:
    """Saves processed Queue Manager records to the PostgreSQL database."""
    global error_count
    logging.info("--- QM DATA PROCESSING AND SAVE ---")

    records: List[Dict[str, Any]] = data.get('Rows', [])
    if not records:
        logging.warning("Received empty QM data set. Skipping save operation.")
        error_count += 1
        return False

    conn = None
    cursor = None
    success_count = 0

    try:
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()
        logging.info(f"DB connection successful. Inserting {len(records)} record(s)...")
        
        # INSERT statement columns are hardcoded, matching the CREATE TABLE structure
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                qmnames, j_target, qmplat, qmplatn, qmstat, qmqstats, 
                qmcomlv, qmiputtr, qmigetr, qnmqmes, qmxqmes, record_timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW());
        """).format(table_name=sql.Identifier(TABLE_NAME))

        for record in records:
            # Extract and Convert Data
            qmnames = safe_extract_api_value(record, "QMNAMES")
            j_target = safe_extract_api_value(record, "J@TARGET")
            qmplat = safe_extract_api_value(record, "QMPLAT")
            qmplatn = safe_extract_api_value(record, "QMPLATN")
            qmstat = safe_extract_api_value(record, "QMSTAT")
            qmqstats = safe_extract_api_value(record, "QMQSTATS")
            qmcomlv = safe_extract_api_value(record, "QMCOMLV")
            
            # Numeric Conversions
            qmiputtr = safe_float(safe_extract_api_value(record, "QMIPUTTR"))
            qmigetr = safe_float(safe_extract_api_value(record, "QMIGETR"))
            qnmqmes = safe_int(safe_extract_api_value(record, "QMNQMES"))
            qmxqmes = safe_int(safe_extract_api_value(record, "QMXQMES"))
            
            row_data = (
                qmnames, j_target, qmplat, qmplatn, qmstat, qmqstats, 
                qmcomlv, qmiputtr, qmigetr, qnmqmes, qmxqmes
            )

            cursor.execute(insert_query, row_data)
            success_count += 1

        conn.commit()
        logging.info(f"{success_count} QM record(s) successfully added to the database.")
        error_count = 0
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"Database insertion failed: {error}")
        error_count += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
        logging.info("Database connection closed.")

# --- MAIN EXECUTION LOOP ---
def main():
    """Manages the continuous data fetching and persistence process."""
    global api_token, error_count

    if not create_table_if_not_exists():
        logging.error("Fatal Error: Table setup failed. Terminating program.")
        return

    if not get_token():
        logging.error("Fatal Error: Token acquisition failed. Terminating program.")
        return

    last_run = datetime.now() - timedelta(seconds=INTERVAL_SECONDS)

    while True:
        try:
            current_time = datetime.now()
            if (current_time - last_run).total_seconds() >= INTERVAL_SECONDS:
                logging.info("\n" + "="*50 + "\n--- QM DATA COLLECTION CYCLE STARTED ---")
                
                api_data = fetch_qm_data()
                
                if api_data == 'reauth':
                    if not get_token():
                        logging.error("Fatal Error: Re-authentication failed. Terminating program.")
                        return
                    api_data = fetch_qm_data()

                if isinstance(api_data, dict):
                    save_qm_data_to_db(api_data)
                elif api_data is not None:
                    error_count += 1

                last_run = current_time

            if error_count >= MAX_ERRORS:
                logging.error(f"Fatal Error: Maximum error count ({MAX_ERRORS}) reached. Terminating program.")
                return

            time_left = INTERVAL_SECONDS - (datetime.now() - last_run).total_seconds()
            if time_left > 0:
                logging.info(f"Waiting for {int(time_left)} seconds...")
                time.sleep(time_left)
            else:
                time.sleep(1) 

        except KeyboardInterrupt:
            logging.info("Program stopped by user (KeyboardInterrupt).")
            break
        except Exception as e:
            logging.error(f"An unexpected error occurred in the main loop: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()