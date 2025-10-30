# Combined version of TRX, ASRM, SRCS Python files.

import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json
import os

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# -------------------
# Global Constants and PostgreSQL Connection Settings
# -------------------
POSTGRES_CONFIG = {
    'host': '192.168.60.148',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678'
}

logger = logging.getLogger(__name__)

# -------------------
# API URLs
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
trx_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/TRX/data"
srcs_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SRCS/data"
asrm_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/ASRM/data"

api_token = None
token_expiry_time = None

# -------------------
# Common Helper Functions
# -------------------
def get_postgres_connection(): # Creates PostgreSQL connection
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None): # Executes the given query
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
        return False
    finally:
        if connection:
            connection.close()

def get_token(): # Gets token
    global api_token, token_expiry_time
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {"username": "VOBA", "password": "OZAN1239"}
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")
            if new_token:
                api_token = new_token
                token_expiry_time = datetime.now(timezone.utc) + timedelta(minutes=15)
                print(f"✅ API Token successfully obtained and saved")
                return api_token
        print(f"❌ Token could not be obtained! HTTP Status Code: {response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ API Connection Error: {e}")
        return None

def get_common_headers_and_params(): # Creates headers and params with token
    headers = {'Authorization': f'Bearer {api_token}'}
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    return headers, params

def check_and_refresh_token(): # Refreshes token if expired
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(timezone.utc) >= token_expiry_time:
        print("🔄 Token expired, getting new token...")
        return get_token()
    return api_token

def extract_numeric_from_api_list(raw_list): # This function converts the single numeric value in the list (which may be in string or dict format) to float.
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

def execute_many(query, data_list): # Adds multiple data to database at once using the given query
    if not data_list:
        print("⚠️  WARNING: No data found for batch insert!")
        return False
        
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
            
        cursor = connection.cursor()
        cursor.executemany(query, data_list)
        connection.commit()
        cursor.close()
        logger.info(f"Total {len(data_list)} records successfully added to database.")
        return True
    except Exception as e:
        logger.error(f"Batch insert (executemany) error: {e}")
        if connection:
            connection.rollback()
        return False
    finally:
        if connection:
            connection.close()

# -------------------
# Table Creation
# -------------------

def trx_create_table(): # Creates TRX table
    query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_trx (
            id SERIAL PRIMARY KEY,
            mxgcnm VARCHAR(8),
            mxgcpn VARCHAR(8),
            mxgtypc VARCHAR(8),
            mxiasac FLOAT,
            mxixavg FLOAT,
            mxircp INTEGER,
            bmctime TIMESTAMP WITH TIME ZONE,
            "time" TIME WITHOUT TIME ZONE
        )
    """
    if execute_query(query):
        print("✅ TRX table (mainview_rmf_trx) successfully created/ready")
    else:
        print("❌ TRX table could not be created! Check database connection")

def asrm_create_table(): # Creates ASRM table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_rmf_asrm (
        id SERIAL PRIMARY KEY,
        asgname TEXT,
        asgcnmc TEXT,
        asgpgp NUMERIC,
        assactm NUMERIC,
        asgrtm NUMERIC,
        asstrc NUMERIC,
        assjsw NUMERIC,
        assscsck NUMERIC,
        assmsock NUMERIC,
        assiocck NUMERIC,
        asssrsck NUMERIC,
        asswmck NUMERIC,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    if execute_query(create_query):
        print("✅ ASRM table (mainview_rmf_asrm) successfully created/ready")
    else:
        print("❌ ASRM table could not be created! Check database connection")

def srcs_create_table(): # Creates SRCS table
    query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_srcs (
            id SERIAL PRIMARY KEY,
            splafcav BIGINT,
            spluicav INTEGER,
            splstfav INTEGER,
            spllpfav INTEGER,
            spllffav INTEGER,
            splcpfav INTEGER,
            splclfav INTEGER,
            splrffav INTEGER,
            splqpcav INTEGER,
            splqpeav INTEGER,
            sclinav FLOAT,
            scllotav FLOAT,
            sclotrav INTEGER,
            sclotwav INTEGER,
            bmctime TIMESTAMP WITH TIME ZONE,
            "time" TIME WITHOUT TIME ZONE
        )
    """
    if execute_query(query):
        print("✅ SRCS table (mainview_rmf_srcs) successfully created/ready")
    else:
        print("❌ SRCS table could not be created! Check database connection")


# -------------------
# Database Write Functions
# -------------------

def trx_process_row(rows): # Fetches TRX API response and writes to database
    if not isinstance(rows, list):
        print("⚠️  TRX API WARNING: Unexpected data format - rows are not in list format!")
        return

    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # String fields
        mxgcnm_value = str(row.get("MXGCNM", ""))
        mxgcpn_value = str(row.get("MXGCPN", ""))
        mxgtypc_value = str(row.get("MXGTYPC", ""))
        
        # Float fields
        mxiasac_value = float(row.get("MXIASAC", 0))
        mxixavg_value = extract_numeric_from_api_list(row.get("MXIXAVG", []))
        
        # Integer fields
        mxircp_value = int(float(row.get("MXIRCP", 0)))

        query = """
            INSERT INTO mainview_rmf_trx (
                mxgcnm, mxgcpn, mxgtypc, mxiasac, mxixavg, mxircp, bmctime, "time"
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        trx_params = (
            mxgcnm_value, mxgcpn_value, mxgtypc_value, mxiasac_value, 
            mxixavg_value, mxircp_value, bmctime, time_t
        )

        if execute_query(query, trx_params):
            print(f"✅ TRX data successfully added to database (UTC: {bmctime.strftime('%H:%M:%S')})")
        else:
            print("❌ TRX data could not be added to database! Check database connection")

def srcs_process_row(rows): # Fetches SRCS API response and writes to database
    if not isinstance(rows, list):
        print("⚠️  SRCS API WARNING: Unexpected data format - rows are not in list format!")
        return

    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # BIGINT fields - converted to integer by removing decimal part
        splafcav_value = int(float(row.get("SPLAFCAV", 0)))
        # INTEGER fields
        spluicav_value = int(float(row.get("SPLUICAV", 0)))
        splstfav_value = int(float(row.get("SPLSTFAV", 0)))
        spllpfav_value = int(float(row.get("SPLLPFAV", 0)))
        spllffav_value = int(float(row.get("SPLLFFAV", 0)))
        splcpfav_value = int(float(row.get("SPLCPFAV", 0)))
        splclfav_value = int(float(row.get("SPLCLFAV", 0)))
        splrffav_value = int(float(row.get("SPLRFFAV", 0)))
        splqpcav_value = int(float(row.get("SPLQPCAV", 0)))
        splqpeav_value = int(float(row.get("SPLQPEAV", 0)))
        sclotrav_value = int(float(row.get("SCLOTRAV", 0)))
        sclotwav_value = int(float(row.get("SCLOTWAV", 0)))
        # FLOAT fields
        sclinav_value = float(row.get("SCLINAV", 0))
        scllotav_value = float(row.get("SCLLOTAV", 0))

        insert_query = """
            INSERT INTO mainview_rmf_srcs (
                bmctime, "time", splafcav, spluicav, splstfav, spllpfav, spllffav, splcpfav, splclfav, splrffav, splqpcav, splqpeav, sclinav, scllotav, sclotrav, sclotwav
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        srcs_params = (
            bmctime, time_t, splafcav_value, spluicav_value, splstfav_value,
            spllpfav_value, spllffav_value, splcpfav_value, splclfav_value,
            splrffav_value, splqpcav_value, splqpeav_value, sclinav_value,
            scllotav_value, sclotrav_value, sclotwav_value
        )

        if execute_query(insert_query, srcs_params):
            print(f"✅ SRCS data successfully added to database (UTC: {bmctime.strftime('%H:%M:%S')})")
        else:
            print("❌ SRCS data could not be added to database! Check database connection")

def asrm_process_row(rows): # Fetches ASRM API response and writes to database #MANY QUERY
    if not isinstance(rows, list):
        logger.warning("Unexpected API format: Rows is not a list.")
        return False

    data_list = []
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        asgname_value = row.get("ASGNAME", "")
        asgcnmc_value = row.get("ASGCNMC", "")
        asgpgp_value = int(row.get("ASGPGP", 0))
        assactm_value = int(row.get("ASSACTM", 0))
        asgrtm_value = int(row.get("ASGRTM", 0))
        asstrc_value = int(row.get("ASSTRC", 0))
        assjsw_value = int(row.get("ASSJSW", 0))
        assscsck_value = float(row.get("ASSSCSCK", 0.0))
        assmsock_value = int(row.get("ASSMSOCK", 0))
        assiocck_value = float(row.get("ASSIOCCK", 0.0))  # Düzeltildi
        asssrsck_value = float(row.get("ASSSRSCK", 0.0))
        asswmck_value = float(row.get("ASSWMCK", 0.0))

        data_list.append((
            bmctime,
            time_t,
            asgname_value,
            asgcnmc_value,
            asgpgp_value,
            assactm_value,
            asgrtm_value,
            asstrc_value,
            assjsw_value,
            assscsck_value,
            assmsock_value,
            assiocck_value,
            asssrsck_value,
            asswmck_value
        ))

    if not data_list:
        logger.warning("⚠️  ASRM: No data to add - API returned empty response")
        return False

    query = """
        INSERT INTO mainview_rmf_asrm (
            bmctime, "time", asgname, asgcnmc, asgpgp, assactm, asgrtm, asstrc,
            assjsw, assscsck, assmsock, assiocck, asssrsck, asswmck
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    success = execute_many(query, data_list)
    if success:
        current_time = datetime.now(timezone.utc)
        print(f"✅ ASRM data successfully added to database (UTC: {current_time.strftime('%H:%M:%S')}) - {len(data_list)} records")
    else:
        print("❌ ASRM data could not be added to database! Check database connection")
    return success

# -------------------
# Data Fetching Functions
# ------------------

def trx_display(): # Fetches TRX API response
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(trx_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("TRX DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(trx_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. TRX DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            trx_process_row(rows)
        else:
            print("⚠️  TRX API returned no data - API returned empty response")
    else:
        print(f"❌ TRX API Error: HTTP {response.status_code} - API access failed")

def srcs_display(): # Fetches SRCS API response
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(srcs_url, params=params, headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("SRCS DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(srcs_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. SRCS DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            srcs_process_row(rows)
        else:
            print("⚠️  SRCS API returned no data - API returned empty response")
    else:
        print(f"❌ SRCS API Error: HTTP {response.status_code} - API access failed")

def asrm_display(): # Fetches ASRM API response
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(asrm_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("ASRM DB: 401 error. Token being refreshed and retrying.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(asrm_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token could not be refreshed. ASRM DB record being skipped.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            asrm_process_row(rows)
        else:
            print("⚠️  ASRM API returned no data - API returned empty response")
    else:
        print(f"❌ ASRM API Error: HTTP {response.status_code} - API access failed")


def main():
    trx_create_table()
    asrm_create_table()
    srcs_create_table()
    api_token = get_token()
    if not api_token:
        logger.error("Token could not be obtained. Terminating program.")
        return
    while True:
        trx_display()
        asrm_display()
        srcs_display()
        print("📊 Data collected from all APIs. Waiting 60 seconds for next data collection...")
        time.sleep(60)

if __name__ == "__main__":
    main()
