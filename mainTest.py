import psycopg2
import requests
import time
import json
import threading
import os
import logging
from psycopg2 import sql
from datetime import datetime, timedelta, timezone
import pytz
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ==================== CONFIGURATION ====================

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
cpu_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JCPU/data"
zfs_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/ZFSFSZ/data"
sysover_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SYSOVER/data"
cpuhiper_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/CPUHIPER/data"
wmsplxz_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/WMSPLXZ/data"
jespool_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JESPOOL/data"

# Global variables
api_token = None
token_expiry_time = None
MAX_ERRORS = 5
error_count_jespool = 0
error_count_wmsplxz = 0

# PostgreSQL connection information
POSTGRES_CONFIG = {
    'host': '192.168.60.148',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678',
    'connect_timeout': 5
}

# Database table names
TABLE_WMSPLXZ = "mainview_mvs_wmsplxz"
TABLE_JESPOOL = "mainview_mvs_jespool"

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mvs_monitoring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ANSI Color codes
ANSI_GREEN = "\x1b[32m"
ANSI_BLUE = "\x1b[34m"
ANSI_YELLOW = "\x1b[33m"
ANSI_RED = "\x1b[31m"
ANSI_WHITE = "\x1b[37m"
ANSI_RESET = "\x1b[0m"

# ==================== COMMON FUNCTIONS ====================

def get_postgres_connection():
    """Creates and returns PostgreSQL connection"""
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None):
    """Executes SQL query and returns result"""
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False        
        cursor = connection.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)        
        connection.commit()
        cursor.close()
        return True        
    except Exception as e:
        logger.error(f"Query error: {e}")
        try:
            logger.error(f"Query: {query}")
            logger.error(f"Parameters: {params}")
        except Exception:
            pass
        return False
    finally:
        if connection:
            connection.close()

def get_token_from_db():
    """Gets active token from database"""
    query = """
        SELECT token, expires_at
        FROM mv_api_tokens
        WHERE is_active = TRUE AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
    """    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return None, None        
        cursor = connection.cursor()
        cursor.execute(query)
        result = cursor.fetchone()        
        if result:
            token, expires_at = result
            return token, expires_at
        else:
            return None, None          
    except Exception as e:
        logger.error(f"Token DB error: {e}")
        return None, None
    finally:
        if connection:
            connection.close()

def save_token_to_db(token, expires_at):
    """Saves new token to database"""
    # First deactivate old tokens
    deactivate_query = "UPDATE mv_api_tokens SET is_active = FALSE"
    execute_query(deactivate_query)  
    # Add new token
    insert_query = """
        INSERT INTO mv_api_tokens (token, expires_at, is_active)
        VALUES (%s, %s, TRUE)
    """    
    if execute_query(insert_query, (token, expires_at)):
        return True
    else:
        return False

def get_token():
    """Gets API token - DB integrated"""
    global api_token, token_expiry_time
    # First try to get token from DB
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # Check if token in DB is still valid
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            return api_token    
    # If no valid token in DB, get new token
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1239"
    }    
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)    
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")          
            if new_token:
                # Calculate token duration (15 minutes)
                expires_at = datetime.now(pytz.UTC) + timedelta(minutes=15)                
                # Save to DB
                if save_token_to_db(new_token, expires_at):
                    api_token = new_token
                    token_expiry_time = expires_at
                    return api_token
                else:
                    return None
            else:
                return None
        else:
            return None            
    except requests.exceptions.RequestException as e:
        return None
    except ValueError as e:
        return None

def get_common_headers_and_params():
    """Returns common headers and parameters"""
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    return headers, params

def check_and_refresh_token():
    """Checks token duration and refreshes if necessary"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        return get_token()
    return api_token

def save_to_json(data, filename):
    """Saves data to JSON file (append mode)"""
    try:
        # Read existing file (if exists)
        existing_data = []
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Add new data
        new_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": data
        }
        existing_data.append(new_entry)
        
        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        return filename
    except Exception as e:
        return None


def extract_numeric_from_api_list(raw_list):
    # This function converts the single numeric value in the list (which may be in string or dict format) to float.
    if not isinstance(raw_list, list) or not raw_list:
        return 0.0
    first_item = raw_list[0]
    if isinstance(first_item, dict):
        try:
            # Tries to get the first value from the dictionary
            value_str = next(iter(first_item.values())) 
            return float(value_str)
        except (StopIteration, ValueError, TypeError):
            return 0.0
    try:
        # Converts if it's a direct string or number
        return float(first_item)
    except (ValueError, TypeError):
        return 0.0


def fetch_api_data(url, view_name):
    """Fetches data from API"""
    if not api_token:
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            return 'reauth'
        return None
    except requests.exceptions.RequestException as e:
        return None

# ==================== TABLE CREATION FUNCTIONS ====================

def sysover_create_table():
    """Creates SYSOVER table"""
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_sysover (
        id SERIAL PRIMARY KEY,
        syxsysn TEXT,
        succpub NUMERIC,
        sucziib NUMERIC,
        scicpavg NUMERIC,
        suciinrt NUMERIC,
        suklqior NUMERIC,
        sukadbpc NUMERIC,
        csrecspu NUMERIC,
        csreecpu NUMERIC,
        csresqpu NUMERIC,
        csreespu NUMERIC,
        sciairw NUMERIC,
        sciiravg NUMERIC,     
        suptoprt NUMERIC,  
        sumecpii TEXT,           
        sciitpip NUMERIC,  
        suwcsspw TEXT,           
        suwcsspi NUMERIC,  
        suwctspw TEXT,           
        suwcbspi NUMERIC,  
        suweaspw TEXT,           
        suweaspi NUMERIC,  
        csrecscn NUMERIC,  
        csreeccn NUMERIC,  
        sugeitm TIMESTAMP WITH TIME ZONE, 
        syguicav TEXT,           
        succrat NUMERIC,  
        syrelacs INTEGER,        
        syrelacm INTEGER,        
        symtprip NUMERIC,  
        screcpa NUMERIC,  
        sysbstat TEXT,
        syzbstat TEXT,         
        sybstcls TEXT,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    execute_query(create_query)

def cpuhiper_create_table():
    """Creates CPUHIPER table"""
    cpuhiper_create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_cpuhiper (
        id SERIAL PRIMARY KEY,
        cpreidh TEXT,      
        cpgtype TEXT,      
        cpbprio TEXT,      
        cpilsha TEXT,      
        cpibsypc NUMERIC,  
        cprehids TEXT,     
        cpustats VARCHAR,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    execute_query(cpuhiper_create_query)

def ensure_jcpu_table_schema():
    """Creates JCPU table"""
    create_table_sql = """
        CREATE TABLE IF NOT EXISTS mainview_mvs_jcpu (
            Jobname VARCHAR(50),
            JES_Job_Number VARCHAR(50),
            Service_Class_Name VARCHAR(50),
            ALL_CPU_seconds DOUBLE PRECISION,
            Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION,
            Using_CPU_Percentage DOUBLE PRECISION,
            time TIMESTAMP,
            bmctime TIME
        )
    """
    execute_query(create_table_sql)
    alter_statements = [
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Jobname VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS JES_Job_Number VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Service_Class_Name VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS ALL_CPU_seconds DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Using_CPU_Percentage DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS time TIMESTAMP",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS bmctime TIME"
    ]
    for stmt in alter_statements:
        execute_query(stmt)

def create_zfs_table():
    """Creates mainview_zfs_file_systems table"""
    drop_table_query = "DROP TABLE IF EXISTS mainview_zfs_file_systems;"
    
    create_table_query = """
    CREATE TABLE mainview_zfs_file_systems (
        zfs_file_system_name VARCHAR(255) NOT NULL,
        system_name VARCHAR(50),
        owning_system VARCHAR(50),
        total_aggregate_size BIGINT,
        aggregate_used_percent DECIMAL(5,2),
        mount_mode VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        cursor.execute(drop_table_query)
        cursor.execute(create_table_query)
        connection.commit()
        cursor.close()
        return True
        
    except Exception as e:
        return False
    finally:
        if connection:
            connection.close()

def create_wmsplxz_table():
    """Creates WMSPLXZ table"""
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_wmsplxz (
        id SERIAL PRIMARY KEY,
        sysplex_name VARCHAR(255),
        system_name VARCHAR(255),
        wlm_velocity_flag VARCHAR(10),
        performance_index NUMERIC,
        install_datetime TIMESTAMP,
        active_policy VARCHAR(255),
        activate_datetime TIMESTAMP,
        record_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    execute_query(create_query)

def create_jespool_table():
    """Creates JESPOOL table"""
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_jespool (
        id SERIAL PRIMARY KEY,
        bmctime TIMESTAMP,
        time TIME,
        smf_id VARCHAR(50),
        total_volumes VARCHAR(50),
        spool_util VARCHAR(50),
        total_tracks VARCHAR(50),
        used_tracks VARCHAR(50),
        active_spool_util VARCHAR(50),
        total_active_tracks VARCHAR(50),
        used_active_tracks VARCHAR(50),
        active_volumes VARCHAR(50),
        volume VARCHAR(50),
        status VARCHAR(50),
        volume_util VARCHAR(50),
        volume_tracks VARCHAR(50),
        volume_used VARCHAR(50),
        other_volumes VARCHAR(50)
    );
    """
    execute_query(create_query)

# ==================== SYSOVER FUNCTIONS ====================
def sysover_process_rows(rows):
    """Processes SYSOVER data and saves to database"""
    if not isinstance(rows, list):
        return

    processed_count = 0
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        syxsysn_value = str(row.get("SYXSYSN", ""))
        
        succpub_value = float(row.get("SUCCPUB", [])) 
        sucziib_value = (row.get("SUCZIIB", [])) 
        scicpavg_value = float(row.get("SCICPAVG", [])) 
        suciinrt_value = float(row.get("SUCIINRT", [])) 
        suklqior_value = (row.get("SUKLQIOR", []))
        sukadbpc_value = (row.get("SUKADBPC", [])) 
        csrecspu_value = float(row.get("CSRECSPU", [])) 
        csreecpu_value = float(row.get("CSREECPU", [])) 
        csresqpu_value = float(row.get("CSRESQPU", [])) 
        csreespu_value = float(row.get("CSREESPU", [])) 
        sciairw_value = (row.get("SCIAIRW", [])) 
        sciiravg_value = float(row.get("SCIIRAVG", [])) 
        suptoprt_value = float(row.get("SUPTOPRT", []))
        sciitpip_value = float(row.get("SCIITPIP", [])) 
        suwcsspi_value = float(row.get("SUWCSSPI", [])) 
        suwcbspi_value = (row.get("SUWCBSPI", [])) 
        suweaspi_value = float(row.get("SUWEASPI", []))  
        csrecscn_value = (row.get("CSRECSCN", [])) 
        csreeccn_value = (row.get("CSREECCN", [])) 
        succrat_value = (row.get("SUCCRAT", [])) 
        syrelacs_value = (row.get("SYRELACS", [])) 
        syrelacm_value = (row.get("SYRELACM", [])) 
        sypmtrip_value = (row.get("SYMTPRIP", [])) 
        screcpa_value = float(row.get("SCRECPA", [])) 

        sumecpii_value = str(row.get("SUMECPII", "")) 
        suwcsspw_value = str(row.get("SUWCSSPW", "")) 
        suwctspw_value = str(row.get("SUWCTSPW", "")) 
        suweaspw_value = str(row.get("SUWEASPW", "")) 
        syguicav_value = str(row.get("SYGUICAV", "")) 
        sysbstat_value = str(row.get("SYSBSTAT", "")) 
        syzbstat_value = str(row.get("SYZBSTAT", "")) 
        sybstcls_value = str(row.get("SYBSTCLS", "")) 

        # Date field needs special processing
        sugeitm_raw = row.get("SUGEITM", [])
        sugeitm_value = None
        if isinstance(sugeitm_raw, list) and len(sugeitm_raw) > 0 and isinstance(sugeitm_raw[0], dict) and '0' in sugeitm_raw[0]:
            try:
                # Remove fractional seconds and convert to datetime object
                dt_str = sugeitm_raw[0]['0'].split('.')[0] 
                sugeitm_value = datetime.strptime(dt_str, '%Y/%m/%d %H:%M:%S')
            except (ValueError, TypeError):
                sugeitm_value = None # Set to None if error occurs

        # Fixed INSERT query from previous response (36 %s placeholders)
        insert_query = """
            INSERT INTO mainview_mvs_sysover
            (syxsysn, succpub, sucziib, scicpavg, suciinrt, suklqior,
             sukadbpc, csrecspu, csreecpu, csresqpu, csreespu, sciairw, 
             sciiravg, suptoprt, sumecpii, sciitpip, suwcsspw, suwcsspi, 
             suwctspw, suwcbspi, suweaspw, suweaspi, csrecscn, csreeccn, 
             sugeitm, syguicav, succrat, syrelacs, syrelacm, symtprip, 
             screcpa, sysbstat,syzbstat,sybstcls, bmctime, "time")
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        sysover_params = (
            syxsysn_value, succpub_value, sucziib_value, scicpavg_value, suciinrt_value, 
            suklqior_value, sukadbpc_value, csrecspu_value, csreecpu_value, csresqpu_value, 
            csreespu_value, sciairw_value, sciiravg_value, suptoprt_value, sumecpii_value, 
            sciitpip_value, suwcsspw_value, suwcsspi_value, suwctspw_value, suwcbspi_value, 
            suweaspw_value, suweaspi_value, csrecscn_value, csreeccn_value, sugeitm_value, 
            syguicav_value, succrat_value, syrelacs_value, syrelacm_value, sypmtrip_value, 
            screcpa_value, sysbstat_value, syzbstat_value, sybstcls_value, bmctime, time_t
        )

        success = execute_query(insert_query, sysover_params)
        if success:
            processed_count += 1
    
    if processed_count > 0:
        print(f"✅ SYSOVER: {processed_count} records processed successfully")
    else:
        print("⚠️ SYSOVER: No records were processed")

def sysover_display():
    """Fetches and processes SYSOVER data"""
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    
    response_cpu = requests.get(sysover_url, params=params, headers=headers, verify=False)
    
    if response_cpu.status_code == 401:
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response_cpu = requests.get(sysover_url, params=params, headers=headers, verify=False)
        else:
            print("❌ SYSOVER: Failed to get token")
            return

    if response_cpu.status_code == 200:
        data = response_cpu.json()
        rows = data.get("Rows", [])
        if rows:
            print(f"📊 SYSOVER: Fetching {len(rows)} records...")
            sysover_process_rows(rows)
        else:
            print("⚠️ SYSOVER: No data found")
    else:
        print(f"❌ SYSOVER: API request failed with status {response_cpu.status_code}")

def sysover_save_json():
    """Fetches SYSOVER API response and saves all data to log file"""
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(sysover_url, params=params, headers=headers, verify=False)
        
        if response.status_code == 401:
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(sysover_url, params=params, headers=headers, verify=False)
            else:
                return

        if response.status_code == 200:
            data = response.json()
            save_to_json(data, "mvs_sysover_log.json")

    except requests.exceptions.RequestException as e:
        pass

# ==================== CPUHIPER FUNCTIONS ====================

def cpuhiper_process_rows(rows):
    """Processes CPUHIPER data and saves to database"""
    if not isinstance(rows, list):
        return

    processed_count = 0
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # Required Text fields
        cpreidh_value = str(row.get("CPREIDH", ""))
        cpgtype_value = str(row.get("CPGTYPE", ""))
        cpbprio_value = str(row.get("CPBPRIO", ""))
        cpilsha_value = str(row.get("CPILSHA", ""))
        cprehids_value = str(row.get("CPREHIDS", ""))
        cpustats_value = str(row.get("CPUSTATS", ""))
        
        # Required Numeric field
        cpibsypc_value = extract_numeric_from_api_list(row.get("CPIBSYPC", []))

        insert_query = """
            INSERT INTO mainview_mvs_cpuhiper
            (cpreidh, cpgtype, cpbprio, cpilsha, cpibsypc, cprehids, cpustats, bmctime, "time")
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cpuhiper_params = (
            cpreidh_value, cpgtype_value, cpbprio_value, cpilsha_value,
            cpibsypc_value, cprehids_value, cpustats_value,
            bmctime, time_t
        )

        success = execute_query(insert_query, cpuhiper_params)
        if success:
            processed_count += 1
    
    if processed_count > 0:
        print(f"✅ CPUHIPER: {processed_count} records processed successfully")
    else:
        print("⚠️ CPUHIPER: No records were processed")

def cpuhiper_display():
    """Fetches and processes CPUHIPER data"""
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(cpuhiper_url, params=params, headers=headers, verify=False)

    if response.status_code == 401:
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(cpuhiper_url, params=params, headers=headers, verify=False)
        else:
            print("❌ CPUHIPER: Failed to get token")
            return

    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            print(f"📊 CPUHIPER: Fetching {len(rows)} records...")
            cpuhiper_process_rows(rows)
        else:
            print("⚠️ CPUHIPER: No data found")
    else:
        print(f"❌ CPUHIPER: API request failed with status {response.status_code}") 

def cpuhiper_save_json():
    """Fetches CPUHIPER API response and saves all data to log file"""
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(cpuhiper_url, params=params, headers=headers, verify=False)
        
        if response.status_code == 401:
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(cpuhiper_url, params=params, headers=headers, verify=False)
            else:
                return

        if response.status_code == 200:
            data = response.json()
            save_to_json(data, "mvs_cpuhiper_log.json")

    except requests.exceptions.RequestException as e:
        pass

# ==================== JCPU FUNCTIONS ====================

def insert_jcpu_data(rows):
    """Saves JCPU data to database"""
    # Derive time information from JACT$INT in first row
    dt_utc = datetime.now(pytz.UTC)
    try:
        if rows:
            first_row = rows[0]
            jact_value = first_row.get("JACT$INT")
            if isinstance(jact_value, list) and jact_value:
                first_values = [list(d.values())[0] for d in jact_value if isinstance(d, dict) and d]
                if first_values:
                    raw_time_str = first_values[0]
                    try:
                        if isinstance(raw_time_str, str) and '/' in raw_time_str:
                            dt_local = datetime.strptime(raw_time_str, '%Y/%m/%d %H:%M:%S.%f')
                            turkey_tz = pytz.timezone('Europe/Istanbul')
                            dt_utc = turkey_tz.localize(dt_local).astimezone(pytz.UTC)
                        elif isinstance(raw_time_str, str) and '+' in raw_time_str:
                            raw_time_str_utc = raw_time_str.replace('+03', '+00')
                            dt_utc = datetime.fromisoformat(raw_time_str_utc.replace('+00', '+00:00'))
                        elif isinstance(raw_time_str, str):
                            dt_local = datetime.strptime(raw_time_str, '%Y-%m-%d %H:%M:%S')
                            turkey_tz = pytz.timezone('Europe/Istanbul')
                            dt_utc = turkey_tz.localize(dt_local).astimezone(pytz.UTC)
                    except Exception:
                        dt_utc = datetime.now(pytz.UTC)
    except Exception:
        dt_utc = datetime.now(pytz.UTC)

    for row in rows:
        asgname_val = row.get("ASGNAME")
        asgjbid_val = row.get("ASGJBID")
        asgcnmc_val = row.get("ASGCNMC")
        asicpsca_raw = row.get("ASICPSCA")
        asicppau_raw = row.get("ASICPPAU")
        asiucpp_raw = row.get("ASIUCPP")

        # Normalize metric shapes to simple string/float values
        def extract_first_metric(value):
            try:
                if isinstance(value, list) and value:
                    first_entry = value[0]
                    if isinstance(first_entry, dict):
                        v = first_entry.get("0")
                        return v
                return value
            except Exception:
                return value

        asicpsca_val = extract_first_metric(asicpsca_raw)
        asicppau_val = extract_first_metric(asicppau_raw)
        asiucpp_val = asiucpp_raw

        insert_query = """
            INSERT INTO mainview_mvs_jcpu
            (Jobname, JES_Job_Number, Service_Class_Name, ALL_CPU_seconds, Unadj_CPU_Util_with_All_Enclaves, Using_CPU_Percentage, time, bmctime)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        def to_float_if_possible(v):
            try:
                if v is None:
                    return None
                return float(v)
            except Exception:
                return v

        # bmctime should be written in +03 (Europe/Istanbul)
        try:
            turkey_tz = pytz.timezone('Europe/Istanbul')
            dt_tr = dt_utc.astimezone(turkey_tz)
            bmctime_value = dt_tr.time()
        except Exception:
            bmctime_value = dt_utc.time()

        params = (
            asgname_val,
            asgjbid_val,
            asgcnmc_val,
            to_float_if_possible(asicpsca_val),
            to_float_if_possible(asicppau_val),
            to_float_if_possible(asiucpp_val),
            dt_utc,
            bmctime_value
        )
        execute_query(insert_query, params)

def cpu_jcpu_display():
    """Fetches and displays JCPU data"""
    headers, params = get_common_headers_and_params()
    response_cpu = requests.get(cpu_url, params=params, headers=headers, verify=False)    
    
    # If we get 401 error, refresh token
    if response_cpu.status_code == 401:
        global api_token
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response_cpu = requests.get(cpu_url, params=params, headers=headers, verify=False)
        else:
            return    
    
    if response_cpu.status_code == 200:
        data = response_cpu.json()
        rows = data.get("Rows", [])
        
        # Save to JSON file
        save_to_json(data, "jcpu_monitoring_data.json")
        
        if rows:
            # Ensure table and columns exist
            ensure_jcpu_table_schema()
            # For DB records
            insert_jcpu_data(rows)
            print(f"✅ JCPU: {len(rows)} records processed")
        else:
            print("⚠️ JCPU: No data found")

# ==================== ZFS FUNCTIONS ====================

def get_zfs_data_many_query():
    """Fetches zFS data with many query - only required fields"""
    if not api_token:
        return None
    
    headers = {
        'Authorization': f'Bearer {api_token}'
    }
    
    # Use fields parameter for many query
    params = {
        'fields': 'ZFFNAME,ZSASYSN,ZFSOWNER,ZFCASIZE,ZFCAUPCT,ZFSMNTS',
        'manyQuery': 'true'
    }
    
    try:
        response = requests.get(zfs_url, headers=headers, params=params, verify=False)
        
        if response.status_code == 200:
            data = response.json()
            
            # Process many query results
            processed_data = process_many_query_results(data)
            return processed_data
        else:
            return None
            
    except requests.exceptions.RequestException as e:
        return None
    except ValueError as e:
        return None

def process_many_query_results(data):
    """Processes many query results"""
    # If data is an array (many query result)
    if isinstance(data, list):
        # Convert array format to Rows format
        processed_data = {
            "rc": 0,
            "system": "VBT1",
            "viewName": "ZFSFSZ",
            "totalRows": len(data),
            "version": "2.1.00",
            "productName": "MVMVS",
            "Rows": []
        }
        
        # For each record, get only the fields we want
        for record in data:
            filtered_record = {}
            required_fields = ['ZFFNAME', 'ZSASYSN', 'ZFSOWNER', 'ZFCASIZE', 'ZFCAUPCT', 'ZFSMNTS']
            
            for field in required_fields:
                if field in record:
                    filtered_record[field] = record[field]
            
            processed_data['Rows'].append(filtered_record)
        
        return processed_data
    
    # If normal format, filter
    elif isinstance(data, dict) and 'Rows' in data:
        return filter_zfs_fields(data)
    
    else:
        return data

def filter_zfs_fields(data):
    """Filters only the zFS fields we want"""
    if 'Rows' not in data:
        return data
    
    # Fields we want
    required_fields = ['ZFFNAME', 'ZSASYSN', 'ZFSOWNER', 'ZFCASIZE', 'ZFCAUPCT', 'ZFSMNTS']
    
    filtered_rows = []
    for row in data['Rows']:
        filtered_row = {}
        for field in required_fields:
            if field in row:
                filtered_row[field] = row[field]
        filtered_rows.append(filtered_row)
    
    # Keep original structure, only filter Rows
    filtered_data = data.copy()
    filtered_data['Rows'] = filtered_rows
    
    return filtered_data

def insert_zfs_data_to_db(zfs_data):
    """Saves zFS data to database"""
    if 'Rows' not in zfs_data or not zfs_data['Rows']:
        return False
    
    # First create table
    if not create_zfs_table():
        return False
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        
        # First clear existing data (optional)
        cursor.execute("DELETE FROM mainview_zfs_file_systems")
        
        # INSERT query for each record
        insert_query = """
        INSERT INTO mainview_zfs_file_systems 
        (zfs_file_system_name, system_name, owning_system, total_aggregate_size, 
         aggregate_used_percent, mount_mode, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        current_time = datetime.now()
        inserted_count = 0
        
        for row in zfs_data['Rows']:
            try:
                # Convert data types
                zfs_name = row.get('ZFFNAME', '')
                system_name = row.get('ZSASYSN', '')
                owning_system = row.get('ZFSOWNER', '')
                total_size = float(row.get('ZFCASIZE', 0)) if row.get('ZFCASIZE') else 0
                used_percent = float(row.get('ZFCAUPCT', 0)) if row.get('ZFCAUPCT') else 0
                mount_mode = row.get('ZFSMNTS', '')
                
                cursor.execute(insert_query, (
                    zfs_name, system_name, owning_system, total_size,
                    used_percent, mount_mode, current_time, current_time
                ))
                inserted_count += 1
                
            except Exception as e:
                continue
        
        connection.commit()
        cursor.close()
        return True
        
    except Exception as e:
        return False
    finally:
        if connection:
            connection.close()

def zfs_monitoring_cycle():
    """Single zFS monitoring cycle"""
    # Fetch zFS data with many query
    zfs_data = get_zfs_data_many_query()
    if zfs_data is None:
        print("❌ zFS: Could not fetch data.")
        return
    
    # Save to JSON
    save_to_json(zfs_data, "zfs_monitoring_data.json")
    
    # Save to database
    insert_zfs_data_to_db(zfs_data)
    
    if 'Rows' in zfs_data and zfs_data['Rows']:
        print(f"✅ zFS: {len(zfs_data['Rows'])} records processed")
    else:
        print("⚠️ zFS: No data found")

# ==================== WMSPLXZ FUNCTIONS ====================

def save_wmsplxz_data(data):
    """Saves WMSPLXZ data to database"""
    global error_count_wmsplxz
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        error_count_wmsplxz += 1
        return False

    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        error_count_wmsplxz += 1
        return False
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        for record in records:
            sysplex_name = record.get("SYGSPLX")
            
            system_name_list = record.get("SYGSYSN")
            system_name = system_name_list[1]['1'] if isinstance(system_name_list, list) and len(system_name_list) > 1 and '1' in system_name_list[1] else None

            wlm_velocity_flag = record.get("SYGFL2")
            
            performance_index_str = record.get("SYIPI")
            try:
                performance_index = float(performance_index_str) if performance_index_str else None
            except (ValueError, TypeError):
                performance_index = None

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
                    pass
            
            activate_datetime = None
            if activate_datetime_str:
                try:
                    activate_datetime = datetime.strptime(activate_datetime_str.split('.')[0], '%Y/%m/%d %H:%M:%S')
                except ValueError:
                    pass
            
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
            """).format(table_name=sql.Identifier(TABLE_WMSPLXZ))
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
        error_count_wmsplxz = 0
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        error_count_wmsplxz += 1
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ==================== JESPOOL FUNCTIONS ====================

def save_jespool_data(data):
    """Saves JESPOOL data to database"""
    global error_count_jespool
    if not data or 'Rows' not in data or not data['Rows']:
        error_count_jespool += 1
        return False

    records = data['Rows']
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**POSTGRES_CONFIG)
        cursor = conn.cursor()
        
        records_added = 0
        current_time = datetime.now().replace(microsecond=0)

        for record in records:
            smf_id = record.get('SCGID', '')
            
            select_query = sql.SQL("""
                SELECT id FROM {table_name}
                WHERE smf_id = %s AND DATE_TRUNC('minute', bmctime) = DATE_TRUNC('minute', %s)
            """).format(table_name=sql.Identifier(TABLE_JESPOOL))

            cursor.execute(select_query, (smf_id, current_time))
            
            if cursor.fetchone():
                continue

            insert_query = sql.SQL("""
                INSERT INTO {table_name}
                (bmctime, time, smf_id, total_volumes, spool_util, total_tracks,
                 used_tracks, active_spool_util, total_active_tracks, used_active_tracks,
                 active_volumes, volume, status, volume_util, volume_tracks, volume_used, other_volumes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """).format(table_name=sql.Identifier(TABLE_JESPOOL))

            values_to_insert = (
                current_time,
                current_time.time(),
                record.get('SCGID', ''),
                record.get('SCIJ2VOL', ''),
                record.get('SCIUTI', ''),
                record.get('SCITKT', ''),
                record.get('SCITKTU', ''),
                record.get('SCIAUTI', ''),
                record.get('SCIATKT', ''),
                record.get('SCIATKTU', ''),
                record.get('SCIJ2ACT', ''),
                record.get('SCIVOL1', ''),
                record.get('SCISTS1', ''),
                record.get('SCIUTI1', ''),
                record.get('SCITKT1', ''),
                record.get('SCITKTU1', ''),
                record.get('SCIJ2OTH', '')
            )
            cursor.execute(insert_query, values_to_insert)
            records_added += 1

        conn.commit()
        if records_added > 0:
            error_count_jespool = 0
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        error_count_jespool += 1
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ==================== MONITORING CYCLE FUNCTIONS ====================

def jcpu_monitoring_cycle():
    """Single JCPU monitoring cycle"""
    cpu_jcpu_display()

def sysover_monitoring_cycle():
    """Single SYSOVER monitoring cycle"""
    sysover_display()
    sysover_save_json()

def cpuhiper_monitoring_cycle():
    """Single CPUHIPER monitoring cycle"""
    cpuhiper_display()
    cpuhiper_save_json()

# ==================== MONITORING THREADS ====================

def jcpu_monitoring_thread():
    """JCPU monitoring thread that runs every 15 minutes"""
    while True:
        try:
            jcpu_monitoring_cycle()
            time.sleep(15 * 60)  # Wait 15 minutes
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(5 * 60)  # Wait 5 minutes in case of error

def zfs_monitoring_thread():
    """zFS monitoring thread that runs every 30 minutes"""
    while True:
        try:
            zfs_monitoring_cycle()
            time.sleep(30 * 60)  # Wait 30 minutes
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(5 * 60)  # Wait 5 minutes in case of error

def sysover_monitoring_thread():
    """SYSOVER monitoring thread that runs every 60 seconds"""
    while True:
        try:
            sysover_monitoring_cycle()
            time.sleep(60)  # Wait 60 seconds
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(30)  # Wait 30 seconds in case of error

def cpuhiper_monitoring_thread():
    """CPUHIPER monitoring thread that runs every 60 seconds"""
    while True:
        try:
            cpuhiper_monitoring_cycle()
            time.sleep(60)  # Wait 60 seconds
        except KeyboardInterrupt:
            break
        except Exception as e:
            time.sleep(30)  # Wait 30 seconds in case of error

# ==================== MAIN FUNCTION ====================

def main():
    """Main function - Starts all monitoring services"""
    global api_token, last_wmsplxz_run, error_count_jespool, error_count_wmsplxz
    
    print("🚀 MVS Monitoring Service Starting...")
    print("📋 Features:")
    print("  • JCPU: Automatic check every 15 minutes")
    print("  • zFS: Automatic check every 30 minutes")
    print("  • SYSOVER: Automatic check every 60 seconds")
    print("  • CPUHIPER: Automatic check every 60 seconds")
    print("  • WMSPLXZ: Automatic check every 2 hours")
    print("  • JESPOOL: Automatic check every 60 seconds")
    print("  • Save to PostgreSQL database")
    print("  • Backup to JSON files")
    print("\n💡 Press Ctrl+C to stop")
    
    # Get token
    if not get_token():
        print("❌ Could not get token. Program terminating.")
        return
    
    # Create tables
    sysover_create_table()
    cpuhiper_create_table()
    ensure_jcpu_table_schema()
    create_wmsplxz_table()
    create_jespool_table()
    
    # Run initial executions immediately
    jcpu_monitoring_cycle()
    zfs_monitoring_cycle()
    sysover_monitoring_cycle()
    cpuhiper_monitoring_cycle()
    
    # Start continuous monitoring with threading
    jcpu_thread = threading.Thread(target=jcpu_monitoring_thread, daemon=True)
    zfs_thread = threading.Thread(target=zfs_monitoring_thread, daemon=True)
    sysover_thread = threading.Thread(target=sysover_monitoring_thread, daemon=True)
    cpuhiper_thread = threading.Thread(target=cpuhiper_monitoring_thread, daemon=True)
    
    jcpu_thread.start()
    zfs_thread.start()
    sysover_thread.start()
    cpuhiper_thread.start()
    
    print("\n✅ Monitoring services started!")
    
    # Main loop for WMSPLXZ and JESPOOL
    JESPOOL_INTERVAL_SECONDS = 60
    WMSPLXZ_INTERVAL_SECONDS = 2 * 60 * 60
    
    # Set time to past so JESPOOL and WMSPLXZ start immediately on first run
    last_jespool_run = datetime.now() - timedelta(seconds=JESPOOL_INTERVAL_SECONDS)
    last_wmsplxz_run = datetime.now() - timedelta(seconds=WMSPLXZ_INTERVAL_SECONDS)

    try:
        # Keep main thread alive
        while True:
            try:
                # Process JESPOOL data every 60 seconds
                if (datetime.now() - last_jespool_run).total_seconds() >= JESPOOL_INTERVAL_SECONDS:
                    jespool_data = fetch_api_data(jespool_url, "JESPOOL")
                    if jespool_data == 'reauth':
                        if not get_token():
                            print("❌ Could not get token. Program terminating.")
                            return
                        jespool_data = fetch_api_data(jespool_url, "JESPOOL")
                    
                    if jespool_data:
                        save_jespool_data(jespool_data)
                        print(f"✅ JESPOOL: Data processed")
                    
                    last_jespool_run = datetime.now()

                # Process WMSPLXZ data every 2 hours
                if (datetime.now() - last_wmsplxz_run).total_seconds() >= WMSPLXZ_INTERVAL_SECONDS:
                    wmsplxz_data = fetch_api_data(wmsplxz_url, "WMSPLXZ")
                    if wmsplxz_data == 'reauth':
                        if not get_token():
                            print("❌ Could not get token. Program terminating.")
                            return
                        wmsplxz_data = fetch_api_data(wmsplxz_url, "WMSPLXZ")
                    
                    if wmsplxz_data:
                        save_wmsplxz_data(wmsplxz_data)
                        print(f"✅ WMSPLXZ: Data processed")
                    
                    last_wmsplxz_run = datetime.now()
                
                if error_count_jespool >= MAX_ERRORS or error_count_wmsplxz >= MAX_ERRORS:
                    print(f"❌ Maximum error count reached. Program terminating.")
                    return

                # Wait time for control loop (60 seconds)
                time.sleep(60)

            except KeyboardInterrupt:
                print("🛑 Stopped by user.")
                break
            except Exception as e:
                time.sleep(30)
                
    except KeyboardInterrupt:
        print("⚠️ MVS Monitoring Service stopping...")
        print("✅ Service terminated successfully")

if __name__ == "__main__":
    main()