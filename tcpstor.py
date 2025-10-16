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
# Update these settings according to your database and API environment.
CONFIG = {
    'database': {
        'host': "192.168.60.145",
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
        'views': "TCPSTOR",
        'username': "VOBA",
        'password': "OZAN1239"
    }
}

TABLE_NAME = "mainview_network_tcpstor"

# API Endpoints
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVIP/views/TCPSTOR/data"

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
    """Creates the TCPSTOR table if it does not exist."""
    conn = get_db_connection()
    if not conn: return False

    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    step_name VARCHAR,
                    system_name VARCHAR,
                    ecsa_current BIGINT,
                    ecsa_max BIGINT,
                    ecsa_limit BIGINT,
                    ecsa_free BIGINT,
                    ecsa_modules BIGINT,
                    private_current BIGINT,
                    private_max BIGINT,
                    private_limit BIGINT,
                    private_free BIGINT,
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

def fetch_tcpstor_data():
    """Fetches 'TCPSTOR' data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'TCPSTOR' data without a token.")
        return None
    headers = {'Authorization': 'Bearer ' + api_token}
    try:
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info(" 'TCPSTOR' data successfully fetched from API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"'TCPSTOR' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"'TCPSTOR' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND STORAGE ---
def save_tcpstor_data_to_db(data):
    """Processes fetched data and saves it to the PostgreSQL database."""
    global error_count
    logging.info("--- TCPSTOR DATA PROCESSING ---")

    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("Invalid or empty TCPSTOR data received. Skipping save.")
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

        def safe_bigint(value, default_value=0):
            """Safely converts a value to a bigint, defaulting to 0."""
            try:
                if value is not None:
                    # '1.3Mi' gibi değerleri işlemek için önce K, M, G vb. dönüşümlerini yapalım
                    value = str(value).replace(',', '').strip()
                    if value.lower().endswith('k'):
                        return int(float(value[:-1]) * 1024)
                    elif value.lower().endswith('m'):
                        return int(float(value[:-1]) * 1024 * 1024)
                    elif value.lower().endswith('g'):
                        return int(float(value[:-1]) * 1024 * 1024 * 1024)
                    else:
                        return int(float(value))
                return default_value
            except (ValueError, TypeError):
                return default_value

        # Prepare data for insertion
        for record in records:
            step_name = record.get("STEPNAM8")
            system_name = record.get("J@SYSTEM")
            
            # Use the robust safe_bigint function for all numerical storage fields
            ecsa_current = safe_bigint(record.get("MVECSACR"))
            ecsa_max = safe_bigint(record.get("MVECSAMX"))
            ecsa_limit = safe_bigint(record.get("MVECSALM"))
            ecsa_free = safe_bigint(record.get("MVECSAFR"))
            ecsa_modules = safe_bigint(record.get("MVECSAMD"))
            private_current = safe_bigint(record.get("MVPVTCR"))
            private_max = safe_bigint(record.get("MVPVTMX"))
            private_limit = safe_bigint(record.get("MVPVTLM"))
            private_free = safe_bigint(record.get("MVPVTFR"))
            
            record_timestamp = datetime.now()

            insert_query = sql.SQL("""
                INSERT INTO {table_name} (
                    step_name, system_name, ecsa_current, ecsa_max, ecsa_limit,
                    ecsa_free, ecsa_modules, private_current, private_max,
                    private_limit, private_free, record_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """).format(table_name=sql.Identifier(TABLE_NAME))

            cursor.execute(insert_query, (
                step_name, system_name, ecsa_current, ecsa_max, ecsa_limit,
                ecsa_free, ecsa_modules, private_current, private_max,
                private_limit, private_free, record_timestamp
            ))
            success_count += 1

        conn.commit()
        logging.info(f"{success_count} TCPSTOR records successfully added to the database.")
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
    """Manages the data fetching and storage process."""
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
                logging.info("\n" + "="*40 + "\n--- TCPSTOR DATA PROCESSING CYCLE ---")
                
                api_data = fetch_tcpstor_data()
                if api_data == 'reauth':
                    if not get_token():
                        logging.error("Fatal: Re-authentication failed. Program terminating.")
                        return
                    api_data = fetch_tcpstor_data()

                if api_data:
                    save_tcpstor_data_to_db(api_data)
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