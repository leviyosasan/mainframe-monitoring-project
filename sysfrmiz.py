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
        'protocol': "http",
        'address': "192.168.60.20",
        'port': 15565,
        'system': "MVERESTAPI_VBT1_3940",
        'products': "MVMVS",
        'views': "SYSFRMIZ", 
        'username': "VOBA",
        'password': "OZAN1239" 
    }
}

# --- TABLO ADI GÜNCELLENDİ ---
TABLE_NAME = "mainview_storage_sysfrmiz"
MONITOR_INTERVAL_SECONDS = 60 

# --- STATIC URLs ---
LOGON_URL = CONFIG['api']['protocol'] + "://" + CONFIG['api']['address'] + ":" + str(CONFIG['api']['port']) + "/cra/serviceGateway/services/" + CONFIG['api']['system'] + "/logon"
DATA_URL = CONFIG['api']['protocol'] + "://" + CONFIG['api']['address'] + ":" + str(CONFIG['api']['port']) + "/cra/serviceGateway/services/" + CONFIG['api']['system'] + "/products/" + CONFIG['api']['products'] + "/views/" + CONFIG['api']['views'] + "/data"

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
    """Checks for and creates the required table (mainview_storage_sysfrmiz) if it does not exist."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    spgid VARCHAR(7) NOT NULL,
                    spluicav BIGINT,
                    spiuonlf BIGINT,
                    spifinav BIGINT,
                    sprefncp NUMERIC(7, 4),
                    spispcav BIGINT,
                    spreasrp NUMERIC(7, 4),
                    spilpfav BIGINT,
                    sprealpp NUMERIC(7, 4),
                    spicpfav BIGINT,
                    spreavpp NUMERIC(7, 4),
                    spiqpcav BIGINT,
                    sprelsqp NUMERIC(7, 4),
                    spiapfav BIGINT,
                    spreprvp NUMERIC(7, 4),
                    spiafcav BIGINT,
                    spreavlp NUMERIC(7, 4),
                    spihvcav BIGINT,
                    sprecmnp NUMERIC(7, 4),
                    spihvsav BIGINT,
                    spreshrp NUMERIC(7, 4),
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

def fetch_sysfrmiz_data():
    """Fetches 'SYSFRMIZ' view data from the API."""
    if not api_token:
        logging.error("Cannot fetch 'SYSFRMIZ' data without a token.")
        return None
        
    headers = {'Authorization': 'Bearer ' + api_token}
    
    try:
        logging.info("🔄 Fetching 'SYSFRMIZ' data from API...")
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        
        api_data = response.json()
        logging.info("✅ 'SYSFRMIZ' data successfully fetched.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"❌ 'SYSFRMIZ' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'SYSFRMIZ' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (DB) ---
def safe_numeric_convert(value, is_integer=False):
    """Cleans and converts the API string data (e.g., '65535.000000') to a number."""
    if value is None or str(value).strip() == '':
        return None
    try:
        dec_val = Decimal(str(value).strip())
        if is_integer:
            return int(dec_val.to_integral_value())
        else:
            return dec_val
    except Exception as e:
        logging.warning(f"⚠️ Data conversion error: Could not convert '{value}' to number.")
        return None

def save_sysfrmiz_data_to_db(data):
    """Processes the data and saves it to the database using bulk insert."""
    global error_count
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Invalid or empty SYSFRMIZ data received. Skipping save.")
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
            # String field
            spgid = record.get("SPGID")
            
            # Integer (BIGINT) fields
            spluicav = safe_numeric_convert(record.get("SPLUICAV"), is_integer=True)
            spiuonlf = safe_numeric_convert(record.get("SPIUONLF"), is_integer=True)
            spifinav = safe_numeric_convert(record.get("SPIFINAV"), is_integer=True)
            spispcav = safe_numeric_convert(record.get("SPISPCAV"), is_integer=True)
            spilpfav = safe_numeric_convert(record.get("SPILPFAV"), is_integer=True)
            spicpfav = safe_numeric_convert(record.get("SPICPFAV"), is_integer=True)
            spiqpcav = safe_numeric_convert(record.get("SPIQPCAV"), is_integer=True)
            spiapfav = safe_numeric_convert(record.get("SPIAPFAV"), is_integer=True)
            spiafcav = safe_numeric_convert(record.get("SPIAFCAV"), is_integer=True)
            spihvcav = safe_numeric_convert(record.get("SPIHVCAV"), is_integer=True)
            spihvsav = safe_numeric_convert(record.get("SPIHVSAV"), is_integer=True)

            # Decimal (NUMERIC) fields
            sprefncp = safe_numeric_convert(record.get("SPREFNCP"))
            spreasrp = safe_numeric_convert(record.get("SPREASRP"))
            sprealpp = safe_numeric_convert(record.get("SPREALPP"))
            spreavpp = safe_numeric_convert(record.get("SPREAVPP"))
            sprelsqp = safe_numeric_convert(record.get("SPRELSQP"))
            spreprvp = safe_numeric_convert(record.get("SPREPRVP"))
            spreavlp = safe_numeric_convert(record.get("SPREAVLP"))
            sprecmnp = safe_numeric_convert(record.get("SPRECMNP"))
            spreshrp = safe_numeric_convert(record.get("SPRESHRP"))
            
            # Timestamp
            bmc_time = datetime.now() 

            processed_rows.append((
                spgid, spluicav, spiuonlf, spifinav, sprefncp, spispcav, spreasrp, spilpfav, sprealpp,
                spicpfav, spreavpp, spiqpcav, sprelsqp, spiapfav, spreprvp, spiafcav, spreavlp,
                spihvcav, sprecmnp, spihvsav, spreshrp, bmc_time
            ))

        # EXECUTE MANY (Bulk Insert)
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                spgid, spluicav, spiuonlf, spifinav, sprefncp, spispcav, spreasrp, spilpfav, sprealpp,
                spicpfav, spreavpp, spiqpcav, sprelsqp, spiapfav, spreprvp, spiafcav, spreavlp,
                spihvcav, sprecmnp, spihvsav, spreshrp, bmc_time
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} SYSFRMIZ records successfully added to DB.")
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
    
    # Initialization: Check/create table and get the initial token
    if not create_table_if_not_exists():
        logging.error("Fatal: Program terminating due to database setup failure.")
        return

    if not get_token():
        logging.error("Fatal: Initial token retrieval failed. Program terminating.")
        return
    
    logging.info(f"--- CONTINUOUS MONITORING STARTED (Interval: {MONITOR_INTERVAL_SECONDS} seconds) ---")
    
    while True:
        try:
            logging.info("\n" + "="*50 + f"\n--- NEW CYCLE STARTED ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ---")
            
            sysfrmiz_data = fetch_sysfrmiz_data()
            
            # Handle token re-authentication if necessary
            if sysfrmiz_data == 'reauth':
                logging.warning("Token renewal initiated...")
                if not get_token():
                    logging.error("Fatal: Re-authentication failed. Program terminating.")
                    return
                sysfrmiz_data = fetch_sysfrmiz_data() 
            
            # Save data if fetch was successful
            if sysfrmiz_data:
                save_sysfrmiz_data_to_db(sysfrmiz_data)
            else:
                error_count += 1
            
            # Check for max errors before sleeping
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