import requests
import time
import json
import os
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime

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
        'protocol': "http",
        'address': "192.168.60.20",
        'port': 15565,
        'system': "MVERESTAPI_VBT1_3940",
        'products': "MVMVS",
        'views': "WMSPLXZ",
        'username': "VOBA",
        'password': "OZAN1239"
    }
}

TABLE_NAME = "mainview_mvs_wmsplxz"

LOGON_URL = f"{SETTINGS['api']['protocol']}://{SETTINGS['api']['address']}:{SETTINGS['api']['port']}/cra/serviceGateway/services/{SETTINGS['api']['system']}/logon"
DATA_URL = f"{SETTINGS['api']['protocol']}://{SETTINGS['api']['address']}:{SETTINGS['api']['port']}/cra/serviceGateway/services/{SETTINGS['api']['system']}/products/{SETTINGS['api']['products']}/views/{SETTINGS['api']['views']}/data"

api_token = None

# --- TOKEN MANAGEMENT ---
def get_auth_token():
    """Authenticates with the API and retrieves a new token."""
    global api_token
    logging.info("--- TOKEN ACQUISITION ---")
    logging.info("🔄 Attempting to get a new token...")
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {
        "username": SETTINGS['api']['username'],
        "password": SETTINGS['api']['password']
    }
    try:
        response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10)
        response.raise_for_status()
        new_token = response.json().get("userToken")
        if new_token:
            api_token = new_token
            logging.info("✅ Token successfully retrieved.")
            return True
        else:
            logging.error("❌ Token not found in response. API response: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Request failed during token acquisition: {e}")
        return False
    except ValueError as e:
        logging.error(f"❌ JSON decoding error: {e}")
        return False

def fetch_wmsplxz_data():
    """Fetches WMSPLXZ data from the API."""
    if not api_token:
        logging.error("Cannot fetch data without a valid token.")
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info("✅ Successfully fetched 'WMSPLXZ' data from the API.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token is expired or invalid. A new token will be requested.")
            return 'reauth'
        logging.error(f"❌ HTTP error when fetching data: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Data fetching failed: {e}")
        return None

# --- DATABASE MANAGEMENT ---
def create_table_if_not_exists(conn):
    """Ensures the necessary database table exists. Creates it if it doesn't."""
    try:
        with conn.cursor() as cursor:
            create_table_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    sysplex_name VARCHAR,
                    system_name VARCHAR,
                    wlm_velocity_flag VARCHAR,
                    performance_index NUMERIC,
                    install_datetime TIMESTAMP,
                    active_policy VARCHAR,
                    activate_datetime TIMESTAMP,
                    record_timestamp TIMESTAMP
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cursor.execute(create_table_query)
        conn.commit()
        logging.info(f"✅ Table '{TABLE_NAME}' checked and created if it didn't exist.")
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ An error occurred while creating the table: {error}")
        raise

def save_wmsplxz_data(data):
    """Saves fetched data to the database."""
    logging.info("--- WMSPLXZ DATA PROCESSING ---")
    if not data or not isinstance(data.get('Rows'), list):
        logging.warning("❌ Received invalid or empty WMSPLXZ data.")
        return
    
    records = data.get('Rows')
    if not records:
        logging.info("ℹ️ No records to process from the API.")
        return
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**SETTINGS['database'])
        create_table_if_not_exists(conn)
        cursor = conn.cursor()
        logging.info("Database connection successful.")

        for record in records:
            # Safely extract data from the API response
            sysplex_name = record.get("SYGSPLX")
            
            system_name_list = record.get("SYGSYSN")
            system_name = system_name_list[1]['1'] if isinstance(system_name_list, list) and len(system_name_list) > 1 and '1' in system_name_list[1] else None

            wlm_velocity_flag = record.get("SYGFL2")
            
            try:
                performance_index = float(record.get("SYIPI")) if record.get("SYIPI") else None
            except (ValueError, TypeError):
                performance_index = None
                logging.warning(f"⚠️ Invalid 'SYIPI' value: '{record.get('SYIPI')}'. Setting to NULL.")

            install_datetime_list = record.get("SYGTDI")
            install_datetime_str = install_datetime_list[0]['0'] if isinstance(install_datetime_list, list) and len(install_datetime_list) > 0 and '0' in install_datetime_list[0] else None
            
            activate_datetime_list = record.get("SYGPTIM")
            activate_datetime_str = activate_datetime_list[0]['0'] if isinstance(activate_datetime_list, list) and len(activate_datetime_list) > 0 and '0' in activate_datetime_list[0] else None

            active_policy = record.get("SYGPNAM")
            
            install_datetime = None
            if install_datetime_str:
                try:
                    install_datetime = datetime.strptime(install_datetime_str.split('.')[0], '%Y/%m/%d %H:%M:%S')
                except ValueError:
                    logging.warning(f"⚠️ Invalid format for 'install_datetime': '{install_datetime_str}'. Saving as NULL.")
            
            activate_datetime = None
            if activate_datetime_str:
                try:
                    activate_datetime = datetime.strptime(activate_datetime_str.split('.')[0], '%Y/%m/%d %H:%M:%S')
                except ValueError:
                    logging.warning(f"⚠️ Invalid format for 'activate_datetime': '{activate_datetime_str}'. Saving as NULL.")
            
            insert_query = sql.SQL("""
                INSERT INTO {table_name} (
                    sysplex_name,
                    system_name,
                    wlm_velocity_flag,
                    performance_index,
                    install_datetime,
                    active_policy,
                    activate_datetime,
                    record_timestamp
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """).format(table_name=sql.Identifier(TABLE_NAME))

            values_to_insert = (
                sysplex_name,
                system_name,
                wlm_velocity_flag,
                performance_index,
                install_datetime,
                active_policy,
                activate_datetime,
                datetime.now()
            )
            cursor.execute(insert_query, values_to_insert)
        conn.commit()
        logging.info(f"✅ Successfully inserted {len(records)} WMSPLXZ records into the database.")
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ A database error occurred: {error}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logging.info("Database connection closed.")

def main():
    """Main execution loop for fetching and saving data."""
    global api_token
    
    if not get_auth_token():
        logging.error("Failed to acquire token. The program will now exit.")
        return

    sleep_time_seconds = 2 * 60 * 60 
    while True:
        logging.info("\n--- Processing WMSPLXZ Data (2-hour cycle) ---")
        wmsplxz_data = fetch_wmsplxz_data()
        
        # Re-authenticate if the token is invalid
        if wmsplxz_data == 'reauth':
            if not get_auth_token():
                logging.error("Re-authentication failed. The program will now exit.")
                return
            wmsplxz_data = fetch_wmsplxz_data()
        
        if wmsplxz_data:
            save_wmsplxz_data(wmsplxz_data)
        
        logging.info(f"⏳ Sleeping for 2 hours... (Next run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
        time.sleep(sleep_time_seconds)

if __name__ == "__main__":
    main()