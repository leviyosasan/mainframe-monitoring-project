import requests
import json
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime
import time

# --- LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# --- APPLICATION SETTINGS ---
SETTINGS = {
    'database': {
        'host': "192.168.60.145",
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

TABLE_NAME = "mainview_cmf_xcfsys"
MONITOR_INTERVAL_SECONDS = 60 

# --- URL DEFINITIONS ---
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/XCFSYS/data"

api_token = None
MAX_ERRORS = 5
error_count = 0

# --- DATABASE OPERATIONS ---

def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    try:
        conn = psycopg2.connect(**SETTINGS['database'])
        return conn
    except Exception as e:
        logging.error(f"❌ Database connection error: {e}")
        return None

def create_table_if_not_exists():
    """Ensures the required table (mainview_cmf_xcfsys) exists, creating it if necessary."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    from_system VARCHAR,
                    to_system VARCHAR,
                    transport_class VARCHAR,
                    total_messages BIGINT,
                    percent_messages_big NUMERIC(7, 4),
                    percent_messages_fit NUMERIC(7, 4),
                    percent_messages_small NUMERIC(7, 4),
                    no_paths_count BIGINT,
                    no_buffers_count BIGINT,
                    percent_messages_degraded NUMERIC(7, 4),
                    transport_class_longest_message BIGINT,
                    avg_used_message_blocks NUMERIC(7, 4),
                    percent_transport_class_buffers_used NUMERIC(7, 4),
                    max_message BIGINT,
                    percent_system_buffers_used NUMERIC(7, 4),
                    max_message_blocks BIGINT,
                    path_direction VARCHAR,
                    record_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
            conn.commit()
        logging.info(f"✅ Table '{TABLE_NAME}' checked and created if needed.")
        return True
    except Exception as e:
        logging.error(f"❌ Table creation error: {e}")
        return False
    finally:
        if conn: conn.close()

# --- TOKEN & DATA FETCHING ---
def get_auth_token():
    """Retrieves the API bearer token by authenticating."""
    global api_token
    logging.info("--- TOKEN MANAGEMENT ---")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": SETTINGS['api']['username'],
        "password": SETTINGS['api']['password']
    }
    
    try:
        logging.info("🔄 Retrieving a new token...")
        response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10) 
        response.raise_for_status()
        
        new_token = response.json().get("userToken")
        if new_token:
            api_token = new_token
            logging.info("✅ Token successfully obtained.")
            return True
        else:
            logging.error("❌ Token not found in response. API response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Request error during logon: {e}")
        return False

def fetch_xcfsys_data():
    """Fetches 'XCFSYS' view data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'XCFSYS' data without a token.")
        return None
        
    headers = {'Authorization': f'Bearer {api_token}'}
    
    try:
        logging.info("🔄 Fetching 'XCFSYS' data from the API...")
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        
        api_data = response.json()
        logging.info("✅ 'XCFSYS' data successfully fetched.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Re-authentication will be attempted.")
            return 'reauth'
        logging.error(f"❌ 'XCFSYS' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'XCFSYS' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (DB) ---
def safe_numeric_convert(value):
    """Safely converts string data from the API to a numeric format."""
    if value is None or str(value).strip() == '':
        return None
    try:
        # Convert the incoming value to a float
        return float(str(value).strip())
    except (ValueError, TypeError):
        logging.warning(f"⚠️ Data conversion error: Could not convert '{value}' to a number.")
        return None

def save_xcfsys_data_to_db(data):
    """Processes the data and saves it to the database using a bulk insert."""
    global error_count
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Received invalid or empty XCFSYS data. Skipping save.")
        error_count += 1
        return False

    conn = get_db_connection()
    if not conn: return False
    
    cursor = None
    processed_rows = []
    
    try:
        cursor = conn.cursor()

        # Prepare each record for insertion into the database
        for record in records:
            # The timestamp is truncated to the second to avoid microsecond data
            processed_rows.append((
                record.get("XSGFSYS"),
                record.get("XSGTSYS"),
                record.get("XSGTCN"),
                safe_numeric_convert(record.get("XSITOTM")),
                safe_numeric_convert(record.get("XSIPBIG")),
                safe_numeric_convert(record.get("XSIPFIT")),
                safe_numeric_convert(record.get("XSIPSML")),
                safe_numeric_convert(record.get("XSINOP")),
                safe_numeric_convert(record.get("XSIBSY")),
                safe_numeric_convert(record.get("XSIPDEG")),
                safe_numeric_convert(record.get("XSGTCL")),
                safe_numeric_convert(record.get("XSIAUSE")),
                safe_numeric_convert(record.get("XSIPSMX")),
                safe_numeric_convert(record.get("XSGSMX")),
                safe_numeric_convert(record.get("XSIPUSE")),
                safe_numeric_convert(record.get("XSGMXB")),
                record.get("XSGDIRC"),
                datetime.now().replace(microsecond=0)
            ))

        # Prepare and execute the bulk insert command
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                from_system, to_system, transport_class, total_messages,
                percent_messages_big, percent_messages_fit, percent_messages_small,
                no_paths_count, no_buffers_count, percent_messages_degraded,
                transport_class_longest_message, avg_used_message_blocks,
                percent_transport_class_buffers_used, max_message,
                percent_system_buffers_used, max_message_blocks, path_direction,
                record_timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} XCFSYS records successfully added to the database.")
        error_count = 0
        return True
    
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ A database save error occurred: {error}")
        error_count += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# --- MAIN FUNCTION (SCHEDULED LOOP) ---
def main():
    """The main execution loop for fetching and saving data."""
    global api_token, error_count
    
    # Initialization: Check/create the table and get the initial token
    if not create_table_if_not_exists():
        logging.error("🚨 Fatal: Database setup failed. The program is terminating.")
        return

    if not get_auth_token():
        logging.error("🚨 Fatal: Initial token retrieval failed. The program is terminating.")
        return
    
    logging.info(f"--- CONTINUOUS MONITORING STARTED (Interval: {MONITOR_INTERVAL_SECONDS} seconds) ---")
    
    while True:
        try:
            logging.info("\n" + "="*50 + f"\n--- NEW CYCLE STARTED ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
            
            xcfsys_data = fetch_xcfsys_data()
            
            # Handle token re-authentication if necessary
            if xcfsys_data == 'reauth':
                logging.warning("Token renewal initiated...")
                if not get_auth_token():
                    logging.error("🚨 Fatal: Re-authentication failed. The program is terminating.")
                    return
                xcfsys_data = fetch_xcfsys_data() 
            
            # Save data if the fetch was successful
            if xcfsys_data:
                save_xcfsys_data_to_db(xcfsys_data)
            else:
                error_count += 1
            
            # Check if the maximum number of errors has been reached
            if error_count >= MAX_ERRORS:
                logging.error(f"🔴 Fatal: Maximum error count ({MAX_ERRORS}) reached. The program is terminating.")
                return

            # Wait for the next cycle
            logging.info(f"⏳ Waiting for {MONITOR_INTERVAL_SECONDS} seconds...")
            time.sleep(MONITOR_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logging.info("🛑 Program stopped by the user (Ctrl+C).")
            break
        except Exception as e:
            logging.error(f"❌ An unexpected error occurred: {e}")
        
if __name__ == "__main__":
    main()