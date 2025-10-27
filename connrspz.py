import requests
import time
import json
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta
import urllib3

# Disable SSL warnings for unverified requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
        'protocol': "http",
        'address': "192.168.60.20",
        'port': 15565,
        'system': "MVERESTAPI_VBT1_3940",
        'products': "MVIP",
        'views': "CONNRSPZ",
        'username': "VOBA",
        'password': "OZAN1239"
    }
}

TABLE_NAME = "mainview_network_connrspz"

# API Endpoints
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/CONNRSPZ/data"

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
        logging.error(f"DB connection error: {e}")
        return None

def create_table_if_not_exists():
    """Creates the CONNRSPZ table if it does not exist."""
    conn = get_db_connection()
    if not conn: return False

    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    foreign_ip_address VARCHAR,
                    active_conns INT,
                    average_rtt_ms INT,
                    max_rtt_ms INT,
                    interval_bytes_in_sum BIGINT,
                    interval_bytes_out_sum BIGINT,
                    stack_name VARCHAR,
                    remote_host_name VARCHAR,
                    interval_duplicate_acks_sum INT,
                    interval_retransmit_count_sum INT,
                    total_conns INT,
                    record_timestamp TIMESTAMP DEFAULT NOW()
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
            conn.commit()
        logging.info(f"Table '{TABLE_NAME}' checked/created.")
        return True
    except Exception as e:
        logging.error(f"Table creation error: {e}")
        return False
    finally:
        if conn: conn.close()

# --- API INTERACTIONS ---

def get_token():
    """Retrieves an API authentication token."""
    global api_token
    logging.info("--- TOKEN OPERATIONS ---")
    logging.info("Retrieving new token...")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": CONFIG['api']['username'],
        "password": CONFIG['api']['password']
    }
    try:
        response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10)
        response.raise_for_status()
        new_token = response.json().get("userToken")
        if new_token:
            api_token = new_token
            logging.info("Token successfully obtained.")
            return True
        else:
            logging.error("Token not found. Response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Request error during token retrieval: {e}")
        return False
    except ValueError as e:
        logging.error(f"JSON parsing error during token retrieval: {e}")
        return False

def fetch_connrspz_data():
    """Fetches 'CONNRSPZ' data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'CONNRSPZ' data without a token.")
        return None
    headers = {'Authorization': 'Bearer ' + api_token}
    try:
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info(" 'CONNRSPZ' data successfully fetched from API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"'CONNRSPZ' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"'CONNRSPZ' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND STORAGE ---
def save_connrspz_data_to_db(data):
    """Processes fetched data and saves it to the PostgreSQL database."""
    global error_count
    logging.info("--- CONNRSPZ DATA PROCESSING ---")

    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("Invalid or empty CONNRSPZ data received. Skipping save.")
        error_count += 1
        return False

    conn = None
    cursor = None
    success_count = 0

    try:
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()
        logging.info("Database connection successful.")

        def safe_int(value, default_value=0):
            """Safely converts a value to an integer, defaulting to 0."""
            try:
                if value is not None:
                    # First convert to float (handles '0.500000'), then to int
                    return int(float(str(value).replace(',', '').strip()))
                return default_value
            except (ValueError, TypeError):
                return default_value

        def safe_bigint(value, default_value=0):
            """Safely converts a value to a bigint, defaulting to 0."""
            try:
                if value is not None:
                    # First convert to float (handles decimal values), then to int
                    return int(float(str(value).replace(',', '').strip()))
                return default_value
            except (ValueError, TypeError):
                return default_value

        # Iterate through each record and insert into the database
        for record in records:
            foreign_ip_address = record.get("FIPADDSC", "UNKNOWN")
            
            # STATE: [{'0': '4'}, {'1': 'Establish'}] -> get first dict's '0' value
            state_data = record.get("STATE", [])
            active_conns = safe_int(state_data[0].get('0', 0) if isinstance(state_data, list) and len(state_data) > 0 else 0)
            
            # RTT: [{'0': '0.500000'}, {'1': '2'}] -> average and max
            rtt_data = record.get("RTT", [])
            average_rtt_ms = safe_int(rtt_data[0].get('0', 0) if isinstance(rtt_data, list) and len(rtt_data) > 0 else 0)
            max_rtt_ms = safe_int(rtt_data[1].get('1', 0) if isinstance(rtt_data, list) and len(rtt_data) > 1 else 0)
            
            interval_bytes_in_sum = safe_bigint(record.get("BYTEID"))
            interval_bytes_out_sum = safe_bigint(record.get("BYTEOD"))
            stack_name = record.get("STACKNM", "UNKNOWN")
            remote_host_name = record.get("DNSNAME", "UNKNOWN")
            interval_duplicate_acks_sum = safe_int(record.get("DUPAKD"))
            interval_retransmit_count_sum = safe_int(record.get("REXMTD"))
            
            # FIPADDLC: [{'0': '127.0.0.1'}, {'1': '4'}] -> get second dict's '1' value
            fipaddlc_data = record.get("FIPADDLC", [])
            total_conns = safe_int(fipaddlc_data[1].get('1', 0) if isinstance(fipaddlc_data, list) and len(fipaddlc_data) > 1 else 0)
            
            print(f"IP: {foreign_ip_address}, Active: {active_conns}, Avg RTT: {average_rtt_ms}, Max RTT: {max_rtt_ms}, Total: {total_conns}")
            
            # Insert into database
            insert_query = sql.SQL("""
                INSERT INTO {table_name} (
                    foreign_ip_address, active_conns, average_rtt_ms, max_rtt_ms,
                    interval_bytes_in_sum, interval_bytes_out_sum, stack_name,
                    remote_host_name, interval_duplicate_acks_sum,
                    interval_retransmit_count_sum, total_conns
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """).format(table_name=sql.Identifier(TABLE_NAME))
            
            cursor.execute(insert_query, (
                foreign_ip_address, active_conns, average_rtt_ms, max_rtt_ms,
                interval_bytes_in_sum, interval_bytes_out_sum, stack_name,
                remote_host_name, interval_duplicate_acks_sum,
                interval_retransmit_count_sum, total_conns
            ))
            success_count += 1

        conn.commit()
        logging.info(f"{success_count} CONNRSPZ records successfully added to the database.")
        error_count = 0
        return True

    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"Database error: {error}")
        error_count += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
        logging.info("Database connection closed.")

# --- MAIN EXECUTION LOOP ---
def main():
    """Orchestrates the data fetching and saving process."""
    global api_token, error_count

    if not create_table_if_not_exists():
        logging.error("Fatal: Program terminating due to database setup failure.")
        return

    if not get_token():
        logging.error("Fatal: Token retrieval failed. Program terminating.")
        return

    INTERVAL_SECONDS = 60
    last_run = datetime.now() - timedelta(seconds=INTERVAL_SECONDS)

    while True:
        try:
            if (datetime.now() - last_run).total_seconds() >= INTERVAL_SECONDS:
                logging.info("\n" + "="*40 + "\n--- CONNRSPZ DATA PROCESSING CYCLE ---")
                
                api_data = fetch_connrspz_data()
                if api_data == 'reauth':
                    if not get_token():
                        logging.error("Fatal: Re-authentication failed. Program terminating.")
                        return
                    api_data = fetch_connrspz_data()

                if api_data:
                    save_connrspz_data_to_db(api_data)
                else:
                    error_count += 1

                last_run = datetime.now()

            if error_count >= MAX_ERRORS:
                logging.error(f"Fatal: Maximum error count ({MAX_ERRORS}) reached. Program terminating.")
                return

            logging.info(f"Waiting for {INTERVAL_SECONDS} seconds... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
            time.sleep(INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logging.info("Program stopped by user.")
            break
        except Exception as e:
            logging.error(f"Unexpected error occurred: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()  