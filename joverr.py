import requests
import json
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta
from decimal import Decimal
import time

# --- LOG SETTINGS ---
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
        'products': "MVMVS",
        'views': "JOVERR",
        'username': "VOBA",
        'password': "OZAN1238" 
    }
}

# --- TABLE NAME AND INTERVAL ---
TABLE_NAME = "mainview_mvs_joverr" # Target table name
MONITOR_INTERVAL_SECONDS = 60 # Cycle interval

# --- STATIC URLS ---
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JOVERR/data"

# Global Variables
api_token = None
MAX_ERRORS = 5
error_count = 0

# --- DATABASE OPERATIONS ---

def get_db_connection():
    """Establishes a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        return conn
    except Exception as e:
        logging.error(f"❌ DB connection error: {e}")
        return None

def create_table_if_not_exists():
    """Checks for and creates the required table ({TABLE_NAME}) if it doesn't exist."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            # Table schema based on JOVERR JSON data types.
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    asgname VARCHAR(50),
                    asgjid VARCHAR(20),
                    asgcnmc VARCHAR(50),
                    asgasid SMALLINT,
                    asgfl1c VARCHAR(30),
                    asrepgmn VARCHAR(30),
                    asgjelt BIGINT,
                    asgjznt TIMESTAMP,
                    asldlyp NUMERIC(7, 3),
                    aslusep NUMERIC(7, 3),
                    aslidlp NUMERIC(7, 3),
                    aslunkp NUMERIC(7, 3),
                    aslcppcu NUMERIC(7, 3),
                    aslxcpr NUMERIC(7, 3),
                    asldpgr NUMERIC(7, 3),
                    aslswpr NUMERIC(7, 3),
                    aslavfu BIGINT,
                    aslwmrt NUMERIC(10, 3),
                    aslcpsc NUMERIC(7, 3),
                    asgzaat NUMERIC(12, 3),
                    asrdzapts NUMERIC(10, 3),
                    asgziitc NUMERIC(12, 3),
                    asrdzipd NUMERIC(10, 3),
                    asrdzapt NUMERIC(6, 3),
                    asrdzipt NUMERIC(6, 3),
                    bmc_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
        if conn: conn.close()

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

def fetch_joverr_data():
    """Fetches 'JOVERR' view data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'JOVERR' data without a token.")
        return None
        
    headers = {'Authorization': 'Bearer ' + api_token}
    
    try:
        logging.info("🔄 Fetching 'JOVERR' data from API...")
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        
        api_data = response.json()
        logging.info(f"✅ 'JOVERR' data successfully fetched. Total {api_data.get('numRows', 0)} records.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"❌ 'JOVERR' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'JOVERR' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (DB) ---

def get_safe_value(record, key):
    """Safely extracts value from JSON, handling the [ { '0': 'value' } ] array structure."""
    value = record.get(key)
    # If the value is in the array structure, return the '0' key's value.
    if isinstance(value, list) and value and isinstance(value[0], dict) and '0' in value[0]:
        return value[0]['0']
    return value

def safe_numeric_convert(value, is_integer=False, is_time_string=False):
    """Cleans and converts the API string data to a number or datetime object."""
    if value is None or str(value).strip() == '':
        return None
    
    # TIMESTAMP conversion
    if is_time_string:
        try:
            # Parse the time string, dropping milliseconds/decimal part
            time_part = str(value).split('.')[0]
            return datetime.strptime(time_part, '%Y/%m/%d %H:%M:%S')
        except ValueError:
            return None

    try:
        # Numeric conversion
        dec_val = Decimal(str(value).strip())
        if is_integer:
            return int(dec_val.to_integral_value())
        else:
            return dec_val
    except Exception as e:
        return None

def save_joverr_data_to_db(data):
    """Processes the data and saves it to the database using bulk insert."""
    global error_count
    logging.info("--- JOVERR DATA PROCESSING AND DB SAVE ---")
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Invalid or empty JOVERR data received. Skipping save.")
        error_count += 1
        return False

    conn = get_db_connection()
    if not conn: return False
    
    cursor = None
    processed_rows = []
    
    try:
        cursor = conn.cursor()

        # Prepare data for bulk insert
        for record in records:
            # Data Extraction and Conversion
            asgname = get_safe_value(record, "ASGNAME")
            asgjid = get_safe_value(record, "ASGJBID")
            asgcnmc = get_safe_value(record, "ASGCNMC")
            asgasid = safe_numeric_convert(get_safe_value(record, "ASGASID"), is_integer=True)
            asgfl1c = get_safe_value(record, "ASGFL1C")
            asrepgmn = get_safe_value(record, "ASREPGMN")
            asgjelt = safe_numeric_convert(get_safe_value(record, "ASGJELT"), is_integer=True)
            asgjznt = safe_numeric_convert(get_safe_value(record, "ASGJZNT"), is_time_string=True)
            
            # Numeric/Rate Fields
            asldlyp = safe_numeric_convert(get_safe_value(record, "ASLDLYP"))
            aslusep = safe_numeric_convert(get_safe_value(record, "ASLUSEP"))
            aslidlp = safe_numeric_convert(get_safe_value(record, "ASLIDLP"))
            aslunkp = safe_numeric_convert(get_safe_value(record, "ASLUNKP"))
            aslcppcu = safe_numeric_convert(get_safe_value(record, "ASLCPPCU"))
            aslxcpr = safe_numeric_convert(get_safe_value(record, "ASLXCPR"))
            asldpgr = safe_numeric_convert(get_safe_value(record, "ASLDPGR"))
            aslswpr = safe_numeric_convert(get_safe_value(record, "ASLSWPR"))
            aslavfu = safe_numeric_convert(get_safe_value(record, "ASLAVFU"), is_integer=True)
            aslwmrt = safe_numeric_convert(get_safe_value(record, "ASLWMRT"))
            aslcpsc = safe_numeric_convert(get_safe_value(record, "ASLCPSC"))
            
            # zAAP/zIIP Fields
            asgzaat = safe_numeric_convert(get_safe_value(record, "ASGZAAT"))
            asrdzapts = safe_numeric_convert(get_safe_value(record, "ASRDZAPTS"))
            asgziitc = safe_numeric_convert(get_safe_value(record, "ASGZIITC"))
            asrdzipd = safe_numeric_convert(get_safe_value(record, "ASRDZIPD"))
            asrdzapt = safe_numeric_convert(get_safe_value(record, "ASRDZAPT"))
            asrdzipt = safe_numeric_convert(get_safe_value(record, "ASRDZIPT"))
            
            bmc_time = datetime.now() # Record timestamp

            processed_rows.append((
                asgname, asgjid, asgcnmc, asgasid, asgfl1c, asrepgmn, asgjelt, asgjznt,
                asldlyp, aslusep, aslidlp, aslunkp, aslcppcu, aslxcpr, asldpgr, aslswpr,
                aslavfu, aslwmrt, aslcpsc, asgzaat, asrdzapts, asgziitc, asrdzipd,
                asrdzapt, asrdzipt, bmc_time
            ))

        # EXECUTE MANY (Bulk Insert)
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                asgname, asgjid, asgcnmc, asgasid, asgfl1c, asrepgmn, asgjelt, asgjznt,
                asldlyp, aslusep, aslidlp, aslunkp, aslcppcu, aslxcpr, asldpgr, aslswpr,
                aslavfu, aslwmrt, aslcpsc, asgzaat, asrdzapts, asgziitc, asrdzipd,
                asrdzapt, asrdzipt, bmc_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} JOVERR records successfully added to DB.")
        error_count = 0
        return True
    
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Database save error: {error}")
        error_count += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# --- MAIN FUNCTION (Scheduled Loop) ---
def main():
    global api_token, error_count
    
    if not create_table_if_not_exists():
        logging.error("Fatal: Database setup failure, program terminating.")
        return

    if not get_token():
        logging.error("Fatal: Initial token retrieval failed. Program terminating.")
        return
    
    logging.info(f"--- JOVERR MONITORING STARTED (Interval: {MONITOR_INTERVAL_SECONDS} seconds) ---")
    
    while True:
        try:
            logging.info("\n" + "="*50 + f"\n--- NEW CYCLE STARTED ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
            
            # Fetch data
            joverr_data = fetch_joverr_data()
            
            # Handle token renewal
            if joverr_data == 'reauth':
                logging.warning("Token renewal initiated...")
                if not get_token():
                    logging.error("Fatal: Re-authentication failed. Program terminating.")
                    return
                joverr_data = fetch_joverr_data() # Retry with new token
            
            # Save data
            if joverr_data:
                save_joverr_data_to_db(joverr_data)
            else:
                error_count += 1
            
            # Error limit check
            if error_count >= MAX_ERRORS:
                logging.error(f"🔴 Fatal: Maximum error count ({MAX_ERRORS}) reached. Program terminating.")
                return

            # Wait for the next cycle
            logging.info(f"⏳ Waiting for {MONITOR_INTERVAL_SECONDS} seconds...")
            time.sleep(MONITOR_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logging.info("🛑 Program stopped by user (Ctrl+C).")
            break
        except Exception as e:
            logging.error(f"❌ Unexpected error occurred: {e}")
        
if __name__ == "__main__":
    main()