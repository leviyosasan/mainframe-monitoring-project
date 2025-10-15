import requests
import time
import json
import os
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta

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
        'views': "ASD", 
        'username': "VOBA",
        'password': "OZAN1239" 
    }
}

# Veritabanı tablo adı (İsteğiniz üzerine 'mainview_rmf_asd' olarak güncellendi)
TABLE_NAME = "mainview_rmf_asd"

# API URL'leri (Statik)
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/ASD/data"

# Global değişkenler
api_token = None
MAX_ERRORS = 5
error_count_asd = 0

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
    """Checks for and creates the ASD table if it does not exist (using TABLE_NAME)."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            # JSON analizi ve belgeye göre oluşturulan nihai şema
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    jobname VARCHAR(50),
                    service_class_name VARCHAR,
                    service_class_index VARCHAR,
                    current_location VARCHAR,
                    swap_out_status VARCHAR,
                    dispatching_priority VARCHAR,
                    central_frame_count INT,
                    expanded_frame_count INT,
                    srm_storage_target VARCHAR,
                    target_working_set INT,
                    cross_memory_flag VARCHAR,
                    page_in_rate FLOAT,
                    expanded_page_in_rate FLOAT,
                    swap_total INT,
                    wlm_recommendation VARCHAR,
                    recommended_wsm_value VARCHAR,
                    record_timestamp TIMESTAMP DEFAULT NOW()
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

# --- TOKEN RETRIEVAL ---
def get_token():
    global api_token
    logging.info("--- TOKEN OPERATIONS ---")
    logging.info("🔄 Retrieving new token...")
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
            logging.info("✅ Token successfully obtained.")
            return True
        else:
            logging.error("❌ Token not found. Response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Request error: {e}")
        return False
    except ValueError as e:
        logging.error(f"❌ JSON parsing error: {e}")
        return False

# --- DATA FETCHING ---
def fetch_asd_data():
    if not api_token:
        logging.error("Cannot fetch 'ASD' data without a token.")
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info("✅ 'ASD' data successfully fetched from API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"❌ 'ASD' API error: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'ASD' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (EXECUTE_MANY) ---
def save_asd_data(data):
    global error_count_asd
    logging.info("--- ASD DATA PROCESSING ---")
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Invalid or empty ASD data received. Skipping save.")
        error_count_asd += 1
        return False

    conn = None
    cursor = None
    processed_rows = []
    
    try:
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()
        logging.info("Database connection successful.")

        def safe_int(key):
            """Safely converts value to an integer."""
            val = record.get(key)
            if not val: return None
            # Dispatching Priority (ASGDP) hex handling
            if key == "ASGDP": 
                val = str(val).replace('0x', '').strip()
                try: 
                    # Convert hex to int if it contains hex digits, otherwise try normal int
                    return int(val, 16) if any(c in 'abcdefABCDEF' for c in val.upper()) else int(val)
                except ValueError: return None
            try:
                # Clean up commas, percent signs, and spaces before converting
                val = str(val).replace(',', '').replace('%', '').strip() 
                return int(val)
            except ValueError:
                return None
        
        def safe_float(key):
            """Safely converts value to a float."""
            val = record.get(key)
            try:
                # Replace comma with dot for international float conversion
                return float(str(val).replace(',', '.').strip()) if val else None
            except ValueError:
                return None

        # Prepare data for executemany
        for record in records:
            # Text fields
            jobname = record.get("ASGNAME")                                 
            service_class_name = record.get("ASGCNMC")                      
            service_class_index = record.get("ASGPGP")                      
            current_location = record.get("ASGQFLC")                        
            swap_out_status = record.get("ASGSRCC")                         
            cross_memory_flag = record.get("ASGXMFC")                      
            wlm_recommendation = record.get("ASGWMR")                       
            recommended_wsm_value = record.get("ASGWSM")                   
            srm_storage_target = record.get("ASGCTGX")                      
            dispatching_priority = record.get("ASGDP")                      
            
            # Numeric fields conversion
            central_frame_count = safe_int("ASGCSFD")                       
            expanded_frame_count = safe_int("ASGESCT")                      
            target_working_set = safe_int("ASGTWSS")                        
            swap_total = safe_int("ASSJSW")                                 
            page_in_rate = safe_float("ASLPINRT")                           
            expanded_page_in_rate = safe_float("ASLPIERT")                   
            
            processed_rows.append((
                jobname, service_class_name, service_class_index, current_location, swap_out_status,
                dispatching_priority, central_frame_count, expanded_frame_count, srm_storage_target,
                target_working_set, cross_memory_flag, page_in_rate, expanded_page_in_rate, 
                swap_total, wlm_recommendation, recommended_wsm_value, datetime.now()
            ))

        # EXECUTE MANY (Bulk insertion)
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                jobname, service_class_name, service_class_index, current_location, swap_out_status,
                dispatching_priority, central_frame_count, expanded_frame_count, srm_storage_target,
                target_working_set, cross_memory_flag, page_in_rate, expanded_page_in_rate, 
                swap_total, wlm_recommendation, recommended_wsm_value, record_timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} ASD records successfully added to DB (Execute Many).")
        error_count_asd = 0
        return True
    
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Database error: {error}")
        error_count_asd += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
        logging.info("Database connection closed.")

# --- MAIN FUNCTION ---
def main():
    global api_token, last_asd_run, error_count_asd
    
    # Check/Create table before starting the main loop
    if not create_table_if_not_exists():
        logging.error("Fatal: Program terminating due to database setup failure.")
        return

    if not get_token():
        logging.error("Fatal: Token retrieval failed. Program terminating.")
        return

    # Set monitoring interval to 60 seconds
    ASD_INTERVAL_SECONDS = 60
    
    # Adjust last run time to ensure the first fetch runs immediately
    last_asd_run = datetime.now() - timedelta(seconds=ASD_INTERVAL_SECONDS)

    while True:
        try:
            # Check if 60 seconds have passed since the last run
            if (datetime.now() - last_asd_run).total_seconds() >= ASD_INTERVAL_SECONDS:
                logging.info("\n" + "="*40 + "\n--- ASD DATA PROCESSING (60 second cycle) ---")
                
                asd_data = fetch_asd_data()
                if asd_data == 'reauth':
                    if not get_token():
                        logging.error("Fatal: Re-authentication failed. Program terminating.")
                        return
                    asd_data = fetch_asd_data() # Retry fetch after re-auth
                
                if asd_data:
                    save_asd_data(asd_data)
                else:
                    error_count_asd += 1
                
                last_asd_run = datetime.now()
            
            if error_count_asd >= MAX_ERRORS:
                logging.error(f"🔴 Fatal: Maximum error count ({MAX_ERRORS}) reached. Program terminating.")
                return

            logging.info(f"⏳ 60 seconds waiting... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
            time.sleep(ASD_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logging.info("🛑 Program stopped by user.")
            break
        except Exception as e:
            logging.error(f"❌ Unexpected error occurred: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()