import requests
import time
import json
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta

# requests'tan gelen SSL uyarılarını kapatır (verify=False kullanıldığı için)
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)

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
        'username': "VOBA",
        'password': "OZAN1239" 
    }
}

# Veritabanı tablo adı
TABLE_NAME = "mainview_rmf_spag"

# API URL'leri (HTTP 404 hatasına neden olan path düzeltildi)
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SPAG/data"

# Word dosyasından alınan SPAG Metrik Alan Adları
SPAG_FIELD_NAMES = [
    "SPLLNIRT", "SPLCINRT", "SPLCOTRT", "SSLTSWRT", "SPLSINRT",
    "SPLSOTRT", "SPLPPIRT", "SPLPPORT", "SPLHVPRT", "SPLCTWAV",
    "SPLAFCAV", "SPLUICAV", "SPLMGAAV", "SPLESFAV", "SPLPESRT",
    "SPLPEART"  
]

# Global değişkenler
api_token = None
MAX_ERRORS = 5
error_count_spag = 0

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
    """Checks for and creates the SPAG table based on JSON analysis (SQL yorumları düzeltildi)."""
    conn = get_db_connection()
    if not conn: return False
    
    try:
        with conn.cursor() as cur:
            # SQL Yorum Satırları "--" ile düzeltildi.
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    
                    -- Rate Fields (FLOAT / REAL) - pages-per-second, swap-per-minute
                    lpa_page_in_rate REAL,          -- SPLLNIRT
                    csa_page_in_rate REAL,          -- SPLCINRT
                    csa_page_out_rate REAL,         -- SPLCOTRT
                    total_swap_rate REAL,           -- SSLTSWRT
                    swap_page_in_rate REAL,         -- SPLSINRT
                    swap_page_out_rate REAL,        -- SPLSOTRT
                    vio_non_vio_page_in_rate REAL,  -- SPLPPIRT
                    vio_non_vio_page_out_rate REAL, -- SPLPPORT
                    vio_paging_rate REAL,           -- SPLHVPRT
                    pages_to_expanded_rate REAL,    -- SPLPESRT
                    pages_to_auxiliary_rate REAL,   -- SPLPEART
                    
                    -- Count/Age Fields (INT / NUMERIC)
                    common_area_target_wset INT,    -- SPLCTWAV
                    available_frames NUMERIC,       -- SPLAFCAV (Büyük sayı olduğu için NUMERIC)
                    current_uic INT,                -- SPLUICAV
                    current_migration_age INT,      -- SPLMGAAV
                    available_expanded_frames NUMERIC,-- SPLESFAV (Büyük sayı olabilir)
                    
                    record_timestamp TIMESTAMP DEFAULT NOW()
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
            conn.commit()
        logging.info(f"✅ Table '{TABLE_NAME}' checked/created for SPAG metrics.")
        return True
    except Exception as e:
        logging.error(f"❌ Table creation error: {e}")
        return False
    finally:
        if conn: conn.close()

# --- TOKEN RETRIEVAL ---
def get_token():
    """MainView API'si için kullanıcı token'ını alır."""
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
        logging.error(f"❌ Request error during token retrieval: {e}")
        return False

# --- DATA FETCHING ---
def fetch_spag_data():
    """API'den SPAG görünüm verilerini çeker."""
    if not api_token:
        logging.error("Cannot fetch 'SPAG' data without a token.")
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    
    params = {
        'fields': ",".join(SPAG_FIELD_NAMES)
    }

    try:
        response = requests.get(DATA_URL, headers=headers, params=params, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info("✅ 'SPAG' data successfully fetched from API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token expired or invalid. Attempting re-authentication.")
            return 'reauth'
        logging.error(f"❌ 'SPAG' API HTTP error: {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ 'SPAG' data fetching error: {e}")
        return None

# --- DATA PROCESSING AND SAVING (EXECUTE_MANY) ---
def save_spag_data(data):
    global error_count_spag
    logging.info("--- SPAG DATA PROCESSING & DB SAVE ---")
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ Invalid or empty SPAG data received. Skipping save.")
        error_count_spag += 1
        return False

    conn = None
    cursor = None
    processed_rows = []
    
    try:
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()

        # Yardımcı Fonksiyonlar (API'den gelen tırnaklı sayıları, JSON örneğine göre temizler)
        def safe_num(key, is_float=False):
            """Safely converts string value to a float or integer."""
            val = records[0].get(key) # SPAG genellikle tek bir satır döndürür
            if not val: return None
            
            # Tırnakları temizle ve uluslararası formatı düzelt (nokta ondalık ayırıcı)
            val_str = str(val).replace(',', '').strip()

            try:
                if is_float:
                    return float(val_str)
                # Int/Numeric için ondalık kısmı atarak dönüştürme (örn. "2931924.000000" -> 2931924)
                return int(float(val_str))
            except ValueError:
                logging.warning(f"⚠️ Value conversion failed for {key}: '{val}'. Setting to None.")
                return None

        # FLOAT fields (Rates)
        lpa_page_in_rate = safe_num("SPLLNIRT", is_float=True) 
        csa_page_in_rate = safe_num("SPLCINRT", is_float=True) 
        csa_page_out_rate = safe_num("SPLCOTRT", is_float=True)
        total_swap_rate = safe_num("SSLTSWRT", is_float=True)
        swap_page_in_rate = safe_num("SPLSINRT", is_float=True)
        swap_page_out_rate = safe_num("SPLSOTRT", is_float=True)
        vio_non_vio_page_in_rate = safe_num("SPLPPIRT", is_float=True)
        vio_non_vio_page_out_rate = safe_num("SPLPPORT", is_float=True)
        vio_paging_rate = safe_num("SPLHVPRT", is_float=True)
        pages_to_expanded_rate = safe_num("SPLPESRT", is_float=True)
        pages_to_auxiliary_rate = safe_num("SPLPEART", is_float=True)
        
        # INT/NUMERIC fields (Counts/Ages)
        common_area_target_wset = safe_num("SPLCTWAV", is_float=False)
        available_frames = safe_num("SPLAFCAV", is_float=False)
        current_uic = safe_num("SPLUICAV", is_float=False)
        current_migration_age = safe_num("SPLMGAAV", is_float=False)
        available_expanded_frames = safe_num("SPLESFAV", is_float=False)
        
        processed_rows.append((
            lpa_page_in_rate, csa_page_in_rate, csa_page_out_rate, total_swap_rate, 
            swap_page_in_rate, swap_page_out_rate, vio_non_vio_page_in_rate, 
            vio_non_vio_page_out_rate, vio_paging_rate, pages_to_expanded_rate, 
            pages_to_auxiliary_rate, common_area_target_wset, available_frames, 
            current_uic, current_migration_age, available_expanded_frames, datetime.now()
        ))

        # EXECUTE MANY
        insert_query = sql.SQL("""
            INSERT INTO {table_name} (
                lpa_page_in_rate, csa_page_in_rate, csa_page_out_rate, total_swap_rate, 
                swap_page_in_rate, swap_page_out_rate, vio_non_vio_page_in_rate, 
                vio_non_vio_page_out_rate, vio_paging_rate, pages_to_expanded_rate, 
                pages_to_auxiliary_rate, common_area_target_wset, available_frames, 
                current_uic, current_migration_age, available_expanded_frames, record_timestamp
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """).format(table_name=sql.Identifier(TABLE_NAME))
        
        cursor.executemany(insert_query, processed_rows)
        conn.commit()
        logging.info(f"✅ {len(processed_rows)} SPAG record(s) successfully added to DB.")
        error_count_spag = 0
        return True
    
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Database error during insertion: {error}")
        error_count_spag += 1
        return False
    finally:
        if cursor: cursor.close()
        if conn: conn.close()
        logging.info("Database connection closed.")

# --- MAIN FUNCTION ---
def main():
    global api_token, last_spag_run, error_count_spag
    
    if not create_table_if_not_exists():
        logging.error("Fatal: Program terminating due to database setup failure.")
        return

    if not get_token():
        logging.error("Fatal: Token retrieval failed. Program terminating.")
        return

    SPAG_INTERVAL_SECONDS = 60 
    last_spag_run = datetime.now() - timedelta(seconds=SPAG_INTERVAL_SECONDS)

    while True:
        try:
            if (datetime.now() - last_spag_run).total_seconds() >= SPAG_INTERVAL_SECONDS:
                logging.info("\n" + "="*40 + "\n--- SPAG DATA FETCH & SAVE CYCLE (60 seconds) ---")
                
                spag_data = fetch_spag_data()
                
                if spag_data == 'reauth':
                    if not get_token():
                        logging.error("Fatal: Re-authentication failed. Program terminating.")
                        return
                    spag_data = fetch_spag_data() 

                if spag_data:
                    save_spag_data(spag_data)
                else:
                    error_count_spag += 1
                
                last_spag_run = datetime.now()
            
            if error_count_spag >= MAX_ERRORS:
                logging.error(f"🔴 Fatal: Maximum error count ({MAX_ERRORS}) reached. Program terminating.")
                return

            logging.info(f"⏳ Waiting for {SPAG_INTERVAL_SECONDS} seconds... (Next run at {(last_spag_run + timedelta(seconds=SPAG_INTERVAL_SECONDS)).strftime('%Y-%m-%d %H:%M:%S')})")
            time.sleep(SPAG_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logging.info("🛑 Program stopped by user.")
            break
        except Exception as e:
            logging.error(f"❌ Unexpected error occurred: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()