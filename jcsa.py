import requests
import json
import logging
import re
import psycopg2
from psycopg2 import sql
from datetime import datetime
import time

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# --- CONFIGURATION ---
CONFIG = {
    'database': {
        'host': "192.168.60.145",
        'port': 5432,
        'database': "mainview",
        'user': "postgres",
        'password': "12345678"
    },
    'api': {
        'system': "MVERESTAPI_VBT1_3940",
        'views': "JCSA",
        'username': "VOBA",
        'password': "OZAN1239" 
    }
}

# --- STATIC URLs ---
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
JCSA_DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JCSA/data"

# Global Variables
api_token = None
MAX_ERRORS = 5
error_count = 0
TABLE_NAME = "mainview_cmf_jcsa"

# --- DATABASE OPERATIONS ---

def get_db_connection():
    """Establishes a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        logging.info("✅ Database connection successful.")
        return conn
    except Exception as e:
        logging.error(f"❌ Database connection error: {e}")
        return None

def create_table_if_not_exists(conn):
    """Checks for and creates the required table if it doesn't exist."""
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    jobname VARCHAR(8),
                    jes_id VARCHAR(8),
                    asid INTEGER,
                    csa_in_use_percent FLOAT,
                    ecsa_in_use_percent FLOAT,
                    sqa_in_use_percent FLOAT,
                    esqa_in_use_percent FLOAT,
                    csa_in_use BIGINT,
                    ecsa_in_use BIGINT,
                    sqa_in_use BIGINT,
                    esqa_in_use BIGINT,
                    total_used_common_storage BIGINT,
                    total_used_percent FLOAT,
                    last_update_time TIMESTAMP,
                    bmc_time TIMESTAMP
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
            conn.commit()
        logging.info(f"✅ Table '{TABLE_NAME}' checked/created successfully.")
        return True
    except Exception as e:
        logging.error(f"❌ Table creation error: {e}")
        return False
    finally:
        pass

# --- TOKEN & DATA FETCHING ---

def get_token():
    """Retrieves the API bearer token."""
    global api_token
    logging.info("--- TOKEN OPERATIONS ---")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": CONFIG['api']['username'],
        "password": CONFIG['api']['password']
    }
    
    try:
        logging.info("🔄 Retrieving new token...")
        response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10) 
        response.raise_for_status()
        
        new_token = response.json().get("userToken")
        if new_token:
            api_token = new_token
            logging.info("✅ Token successfully obtained.")
            return True
        else:
            logging.error("❌ Token not found. Response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Request error (Logon): {e}")
        return False

def fetch_jcsa_data():
    """Fetches 'JCSA' view data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'JCSA' data without a token.")
        return None
        
    headers = {'Authorization': 'Bearer ' + api_token}
    
    try:
        logging.info("🔄 Fetching 'JCSA' data from API...")
        response = requests.get(JCSA_DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        
        api_data = response.json()
        logging.info(f"✅ 'JCSA' data successfully fetched. Total {api_data.get('numRows', 0)} records.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"❌ 'JCSA' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'JCSA' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (DB) ---
def convert_size_to_bytes(value_str):
    """Converts memory size strings with units ('Mi', 'Ki') to bytes."""
    if not isinstance(value_str, str):
        return value_str
    
    value_str = value_str.strip()
    match = re.match(r'(\d+)(\.\d+)?([MK]i)?', value_str)
    
    if not match:
        return None
    
    value = float(match.group(1) + (match.group(2) or ''))
    unit = match.group(3)
    
    if unit == 'Mi':
        return int(value * 1024 * 1024)
    elif unit == 'Ki':
        return int(value * 1024)
    else:
        try:
            return int(value)
        except ValueError:
            return None

def safe_cast_float(value):
    """Safely converts a value to a float."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def safe_cast_timestamp(value_list):
    """Extracts and converts a timestamp from the JSON, rounding to the nearest second."""
    if isinstance(value_list, list) and value_list and isinstance(value_list[0], dict):
        time_str = value_list[0].get("0")
        if time_str:
            try:
                time_str_cleaned = time_str.split('.')[0]
                return datetime.strptime(time_str_cleaned, '%Y/%m/%d %H:%M:%S')
            except ValueError:
                return None
    return None

def save_jcsa_data_to_db(conn, data):
    """Processes and saves data to the database in a single bulk insert."""
    global error_count
    logging.info("--- JCSA DATA PROCESSING AND DB SAVE ---")
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Invalid or empty JCSA data received. Skipping save.")
        error_count += 1
        return False

    cursor = None
    processed_rows = []
    
    try:
        cursor = conn.cursor()
        
        bmc_time_now = datetime.now().replace(microsecond=0)

        for record in records:
            jobname = record.get("CDREJNAM")
            jes_id = record.get("CDREJID")
            asid = safe_cast_float(record.get("CDREASID"))
            
            csa_in_use_percent = safe_cast_float(record.get("CDRECSUP"))
            ecsa_in_use_percent = safe_cast_float(record.get("CDREECUP"))
            sqa_in_use_percent = safe_cast_float(record.get("CDRESQUP"))
            esqa_in_use_percent = safe_cast_float(record.get("CDREESUP"))
            
            csa_in_use = convert_size_to_bytes(record.get("CDRECSAU"))
            ecsa_in_use = convert_size_to_bytes(record.get("CDREECSU"))
            sqa_in_use = convert_size_to_bytes(record.get("CDRESQAU"))
            esqa_in_use = convert_size_to_bytes(record.get("CDREESQU"))
            
            total_used_common_storage = convert_size_to_bytes(record.get("CDRETU"))
            total_used_percent = safe_cast_float(record.get("CDRETUP"))
            
            last_update_time = safe_cast_timestamp(record.get("JACT$INT"))
            
            processed_rows.append((
                jobname, jes_id, asid, csa_in_use_percent, ecsa_in_use_percent,
                sqa_in_use_percent, esqa_in_use_percent, csa_in_use, ecsa_in_use,
                sqa_in_use, esqa_in_use, total_used_common_storage, total_used_percent,
                last_update_time, bmc_time_now
            ))
            
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                jobname, jes_id, asid, csa_in_use_percent, ecsa_in_use_percent,
                sqa_in_use_percent, esqa_in_use_percent, csa_in_use, ecsa_in_use,
                sqa_in_use, esqa_in_use, total_used_common_storage, total_used_percent,
                last_update_time, bmc_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} JCSA records successfully added to the database.")
        error_count = 0
        return True
    
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Database save error: {error}")
        error_count += 1
        return False
    finally:
        if cursor: cursor.close()

# --- MAIN FUNCTION (SCHEDULED LOOP) ---
def main():
    global api_token, error_count
    
    logging.info("--- JCSA DATA COLLECTION TOOL STARTED ---")

    conn = get_db_connection()
    if not conn:
        logging.error("Fatal: Database connection failed. Terminating program.")
        return
    
    if not create_table_if_not_exists(conn):
        logging.error("Fatal: Table could not be created. Terminating program.")
        return
    
    conn.close()

    if not get_token():
        logging.error("Fatal: Initial token retrieval failed. Terminating program.")
        return
    
    logging.info("--- JCSA MONITORING STARTED (Interval: 60 seconds) ---")
    
    while True:
        try:
            logging.info("\n" + "="*50 + f"\n--- NEW CYCLE STARTED ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
            
            jcsa_data = fetch_jcsa_data()
            
            if jcsa_data == 'reauth':
                logging.warning("Token renewal initiated.")
                if not get_token():
                    logging.error("Fatal: Re-authentication failed. Terminating program.")
                    return
                jcsa_data = fetch_jcsa_data()
            
            if jcsa_data:
                conn = get_db_connection()
                if conn:
                    save_jcsa_data_to_db(conn, jcsa_data)
                    conn.close()
                else:
                    error_count += 1
            else:
                error_count += 1
            
            if error_count >= MAX_ERRORS:
                logging.error(f"🔴 Fatal: Maximum error count ({MAX_ERRORS}) reached. Terminating program.")
                return

            logging.info(f"⏳ Waiting for 60 seconds...")
            time.sleep(60)

        except KeyboardInterrupt:
            logging.info("🛑 Program stopped by user (Ctrl+C).")
            break
        except Exception as e:
            logging.error(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()