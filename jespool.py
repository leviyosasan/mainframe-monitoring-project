import requests
import time
import json
import logging
import urllib3
import psycopg2
from psycopg2 import sql
import datetime
from decimal import Decimal

# Suppresses SSL warnings related to 'verify=False' in requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# === CONFIGURATION ===
CONFIG = {
    'api': {
        'address': "192.168.60.20",
        'port': "15565",
        'protocol': "http",
        'system': "MVERESTAPI_VBT1_3940",
        'product': "MVMVS",
        'view': "JESPOOL",
        'username': "VOBA",
        'password': "OZAN1239"
    },
    'database': {
        'host': "192.168.60.148",
        'port': 5432,
        'database': "mainview",
        'user': "postgres",
        'password': "12345678"
    }
}

TABLE_NAME = "mainview_mvs_jespool"
MONITOR_INTERVAL_SECONDS = 60 

# --- STATIC URLS ---
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
JESPOOL_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JESPOOL/data"

# Global Variables
API_TOKEN = None
MAX_ERRORS = 5
ERROR_COUNT = 0

# === LOG SETTINGS ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

# --- UTILITY FUNCTIONS ---

def get_db_connection():
    """Establishes a PostgreSQL connection."""
    try:
        return psycopg2.connect(**CONFIG['database'])
    except Exception as e:
        logging.error(f"❌ DB connection error: {e}")
        return None

def get_current_time():
    """Returns the current system time, adjusted by -3 hours, without microseconds."""
    current_dt = datetime.datetime.now()
    # Note: Adjusting for potential time zone differences relative to the mainframe.
    adjusted_dt = current_dt.replace(microsecond=0) - datetime.timedelta(hours=3)
    return adjusted_dt

def safe_numeric_convert(value):
    """Cleans and converts the API string data to a Decimal for saving as NUMERIC."""
    if value is None or str(value).strip() == '':
        return None
    try:
        # Clean up common non-numeric characters (comma for decimal, percentage sign)
        cleaned_value = str(value).replace(',', '.').replace('%', '').strip()
        # Use Decimal for accurate storage in PostgreSQL NUMERIC types
        return Decimal(cleaned_value)
    except Exception:
        return None
        
def create_table_if_not_exists():
    """Checks for and creates the required JESPOOL table if it does not exist."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            # Table schema based on JESPOOL data types.
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    bmctime TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                    time TIME WITHOUT TIME ZONE,
                    smf_id VARCHAR,
                    total_volumes SMALLINT,
                    spool_util NUMERIC(6, 2),
                    total_tracks BIGINT,
                    used_tracks BIGINT,
                    active_spool_util NUMERIC(6, 2),
                    total_active_tracks BIGINT,
                    used_active_tracks BIGINT,
                    active_volumes SMALLINT,
                    volume VARCHAR(8),
                    status VARCHAR(10),
                    volume_util NUMERIC(6, 2),
                    volume_tracks BIGINT,
                    volume_used BIGINT,
                    other_volumes SMALLINT
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
            conn.commit()
        logging.info(f"✅ Table '{TABLE_NAME}' checked/created.")
        return True
    except Exception as e:
        logging.error(f"❌ Table creation error: {e}")
        return False
    finally:
        if conn: conn.close()

# --- API FUNCTIONS ---

def get_token():
    """Fetches the API token and updates the global API_TOKEN."""
    global API_TOKEN
    logging.info("Fetching token...")
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": CONFIG['api']['username'],
        "password": CONFIG['api']['password']
    }

    try:
        response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10)
        if response.status_code == 200:
            API_TOKEN = response.json().get("userToken")
            if API_TOKEN:
                logging.info("✅ Token successfully obtained")
                return True
        logging.error(f"❌ Failed to obtain token! HTTP {response.status_code}")
        return False
    except Exception as e:
        logging.error(f"❌ Token error: {e}")
        return False

def fetch_data():
    """Fetches JESPool data using the global API_TOKEN."""
    global API_TOKEN
    
    if not API_TOKEN:
        if not get_token():
            return None

    headers = {'Authorization': f'Bearer {API_TOKEN}'}

    try:
        logging.info("🌐 Sending API request...")
        response = requests.get(JESPOOL_URL, headers=headers, verify=False, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            logging.warning("🔑 Token expired, refreshing...")
            API_TOKEN = None
            if get_token():
                # Retry after successful token refresh
                return fetch_data() 
            else:
                logging.error("❌ Token refresh failed.")
                return None
        else:
            logging.error(f"❌ API error: HTTP {response.status_code}")
            return None

    except Exception as e:
        logging.error(f"❌ Request error: {e}")
        return None

# --- DATA PROCESSING & DB OPERATIONS ---

def process_data(api_data):
    """Processes API data for database insertion."""
    if not api_data or 'Rows' not in api_data:
        logging.warning("⚠️ 'Rows' not found in API data")
        return None

    rows = api_data['Rows']
    if not rows:
        logging.info("ℹ️ No new data found in API response")
        return None

    # Get system time for DB timestamp (adjusted)
    bmctime = get_current_time()
    time_only = bmctime.time()
    
    processed_data = []
    
    # Extract, convert, and prepare data for bulk insertion
    for row in rows:
        processed_data.append({
            'utc_time': bmctime,
            'local_time': time_only,
            'smf_id': row.get('SCGID', ''),
            'total_volumes': safe_numeric_convert(row.get('SCIJ2VOL', '')),
            'spool_util': safe_numeric_convert(row.get('SCIUTI', '')),
            'total_tracks': safe_numeric_convert(row.get('SCITKT', '')),
            'used_tracks': safe_numeric_convert(row.get('SCITKTU', '')),
            'active_spool_util': safe_numeric_convert(row.get('SCIAUTI', '')),
            'total_active_tracks': safe_numeric_convert(row.get('SCIATKT', '')),
            'used_active_tracks': safe_numeric_convert(row.get('SCIATKTU', '')),
            'active_volumes': safe_numeric_convert(row.get('SCIJ2ACT', '')),
            'volume': row.get('SCIVOL1', ''),
            'status': row.get('SCISTS1', ''),
            'volume_util': safe_numeric_convert(row.get('SCIUTI1', '')),
            'volume_tracks': safe_numeric_convert(row.get('SCITKT1', '')),
            'volume_used': safe_numeric_convert(row.get('SCITKTU1', '')),
            'other_volumes': safe_numeric_convert(row.get('SCIJ2OTH', ''))
        })

    return processed_data

def save_to_db(processed_data):
    """Saves data to the database using bulk insert."""
    global ERROR_COUNT
    if not processed_data:
        return False

    conn = get_db_connection()
    if not conn:
        return False

    try:
        with conn.cursor() as cur:
            records_added = 0
            
            for record in processed_data:
                # Duplication Check: Checks if a record already exists for this exact time and ID
                cur.execute(sql.SQL("""
                    SELECT id FROM {table_name}
                    WHERE bmctime = %s AND smf_id = %s
                """).format(table_name=sql.Identifier(TABLE_NAME)), (record['utc_time'], record['smf_id']))
                
                if cur.fetchone():
                    continue 
                
                # Insert new record
                cur.execute(sql.SQL("""
                    INSERT INTO {table_name}
                    (bmctime, time, smf_id, total_volumes, spool_util, total_tracks,
                     used_tracks, active_spool_util, total_active_tracks, used_active_tracks,
                     active_volumes, volume, status, volume_util, volume_tracks, volume_used, other_volumes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """).format(table_name=sql.Identifier(TABLE_NAME)), (
                    record['utc_time'],
                    record['local_time'],
                    record['smf_id'],
                    record['total_volumes'],
                    record['spool_util'],
                    record['total_tracks'],
                    record['used_tracks'],
                    record['active_spool_util'],
                    record['total_active_tracks'],
                    record['used_active_tracks'],
                    record['active_volumes'],
                    record['volume'],
                    record['status'],
                    record['volume_util'],
                    record['volume_tracks'],
                    record['volume_used'],
                    record['other_volumes']
                ))
                
                records_added += 1
                logging.info(f"📝 NEW RECORD: {record['utc_time'].strftime('%H:%M:%S')} - Util:%{record['spool_util']}")

            conn.commit()
            
            if records_added > 0:
                logging.info(f"✅ {records_added} new record(s) added")
            else:
                logging.info("ℹ️ No new records added (Duplicate or empty)")
            
            return True
            
    except Exception as e:
        logging.error(f"❌ DB write error: {e}")
        return False
    finally:
        if conn: conn.close()

def show_recent_records():
    """Displays recent records from the database for immediate verification."""
    conn = get_db_connection()
    if not conn:
        return

    try:
        with conn.cursor() as cur:
            cur.execute(sql.SQL("""
                SELECT id,
                        TO_CHAR(bmctime, 'YYYY-MM-DD HH24:MI:SS') as bmc_time,
                        time as time_only,
                        spool_util, used_tracks, total_tracks, active_volumes
                FROM {table_name}
                ORDER BY bmctime DESC LIMIT 5
            """).format(table_name=sql.Identifier(TABLE_NAME)))
            
            logging.info("📊 LAST 5 RECORDS:")
            for record in cur.fetchall():
                logging.info(f"  {record[0]:3} | {record[1]} | Time:{record[2]} | Util:%{record[3]:>5} | Used:{record[4]:>7} | Total:{record[5]:>8} | Active:{record[6]}")
                
    except Exception as e:
        logging.error(f"❌ Record read error: {e}")
    finally:
        if conn: conn.close()

# --- MAIN EXECUTION ---

def run_monitor():
    """Main execution loop for continuous monitoring."""
    global API_TOKEN, ERROR_COUNT
    logging.info("🚀 JESPOOL Monitoring Service Started")

    # Critical Step 1: Ensure the database table exists
    if not create_table_if_not_exists():
        logging.error("❌ Fatal: Database table creation failed. Exiting.")
        return

    # Critical Step 2: Get the initial token
    if not get_token():
        logging.error("❌ Fatal: Initial token retrieval failed. Exiting.")
        return

    while ERROR_COUNT < MAX_ERRORS:
        try:
            logging.info("\n" + "="*40)
            
            api_data = fetch_data()
            if api_data:
                processed_data = process_data(api_data)
                
                if processed_data:
                    if save_to_db(processed_data):
                        ERROR_COUNT = 0
                        show_recent_records()
                    else:
                        ERROR_COUNT += 1
                else:
                    # API returned data (200 OK) but no rows were processed (e.g., duplicate data or empty payload)
                    ERROR_COUNT = 0
            else:
                # API call failed (logged in fetch_data)
                ERROR_COUNT += 1
            
            if ERROR_COUNT >= MAX_ERRORS:
                logging.error("🔴 Maximum error count reached. Monitoring stopped.")
                break

            logging.info(f"⏳ Waiting for {MONITOR_INTERVAL_SECONDS} seconds...")
            time.sleep(MONITOR_INTERVAL_SECONDS)
            
        except KeyboardInterrupt:
            logging.info("🛑 Monitoring stopped by user.")
            break
        except Exception as e:
            logging.error(f"❌ Unexpected error during cycle: {e}")
            ERROR_COUNT += 1
            time.sleep(30)

    if ERROR_COUNT >= MAX_ERRORS:
        logging.error("🔴 Monitoring terminated due to critical errors.")

if __name__ == "__main__":
    run_monitor()