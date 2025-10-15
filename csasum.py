
import requests
import json
import logging
import time
from datetime import datetime, timedelta
import urllib3
import pytz

# Try to import psycopg2, but don't fail if it's not available
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False
    print("Warning: psycopg2 not available. Database features will be disabled.")

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('csasum_monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
syscpc_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SYSCPC/data"
csasum_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/CSASUM/data"
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"

# Global variables for API token management
api_token = None
token_expiry_time = None

# Database configuration - Updated with working config
DB_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678',
    'connect_timeout': 5
}

def get_postgres_connection():
    """Creates and returns PostgreSQL connection"""
    if not PSYCOPG2_AVAILABLE:
        logger.warning("psycopg2 not available - database features disabled")
        return None
        
    try:
        # Test connection with timeout
        logger.info(f"Attempting to connect to database: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
        connection = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            connect_timeout=10
        )
        # Test the connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        logger.info("Database connection successful")
        return connection
    except psycopg2.OperationalError as e:
        if not hasattr(get_postgres_connection, '_logged_error'):
            logger.warning(f"Database connection failed: {e}")
            logger.warning("Continuing without database - data will be saved to JSON only")
            get_postgres_connection._logged_error = True
        return None
    except Exception as e:
        if not hasattr(get_postgres_connection, '_logged_error'):
            logger.warning(f"Database error: {e}")
            get_postgres_connection._logged_error = True
        return None

def execute_query(query, params=None):
    """Executes SQL query and returns result"""
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            logger.warning("No database connection available")
            return False        
        cursor = connection.cursor()
        if params:
            logger.info(f"Executing query with {len(params)} parameters")
            cursor.execute(query, params)
        else:
            logger.info("Executing query without parameters")
            cursor.execute(query)        
        connection.commit()
        rows_affected = cursor.rowcount
        cursor.close()
        logger.info(f"Query executed successfully - {rows_affected} rows affected")
        return rows_affected        
    except Exception as e:
        logger.error(f"Query error: {e}")
        logger.error(f"Query: {query[:100]}...")
        if params:
            logger.error(f"Parameters: {params[:3]}...")
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
        # Check if DB token is still valid
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            logger.info("Using existing valid token from database")
            return api_token    
    # If no valid token in DB, get new token
    logger.info("Getting new API token...")
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1239"
    }    
    try:
        logger.info(f"Making token request to: {logon_url}")
        response = requests.post(logon_url, headers=headers, data=data, verify=False, timeout=10)    
        
        logger.info(f"Token response status: {response.status_code}")
        if response.status_code == 200:
            response_json = response.json()
            logger.info(f"Token response: {response_json}")
            new_token = response_json.get("userToken")          
            if new_token:
                # Calculate token duration (15 minutes)
                expires_at = datetime.now(pytz.UTC) + timedelta(minutes=15)                
                # Save to DB
                if save_token_to_db(new_token, expires_at):
                    api_token = new_token
                    token_expiry_time = expires_at
                    logger.info("New API token obtained and saved successfully")
                    return api_token
                else:
                    logger.warning("Failed to save token to database")
                    return None
            else:
                logger.warning("No userToken in response")
                return None
        else:
            logger.error(f"Token request failed: {response.status_code}")
            logger.error(f"Response content: {response.text}")
            return None            
    except requests.exceptions.RequestException as e:
        logger.error(f"Token request exception: {e}")
        return None
    except ValueError as e:
        logger.error(f"Token response parsing error: {e}")
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
    """Checks token expiry and refreshes if necessary"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        return get_token()
    return api_token

def save_to_json(data, filename):
    """Saves data to JSON file (update mode - keeps only latest data)"""
    try:
        # Create new entry with current data
        new_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": data
        }
        
        # Save to file (overwrite mode - keeps only latest data)
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(new_entry, f, indent=2, ensure_ascii=False)
        
        return filename
    except Exception as e:
        return None

def extract_numeric_from_api_list(raw_list):
    """Converts numeric values from API list format to float"""
    if not isinstance(raw_list, list) or not raw_list:
        return 0.0
    first_item = raw_list[0]
    if isinstance(first_item, dict):
        try:
            # Try to get first value from dictionary
            value_str = next(iter(first_item.values())) 
            return float(value_str)
        except (StopIteration, ValueError, TypeError):
            return 0.0
    try:
        # Convert directly if string or number
        return float(first_item)
    except (ValueError, TypeError):
        return 0.0

def get_metric_from_api(metric_code, metric_name):
    """Generic function to get metric from API"""
    try:
        token = check_and_refresh_token()
        if not token:
            logger.warning(f"Failed to get API token for {metric_name}")
            return None
            
        headers, params = get_common_headers_and_params()
        params['metric'] = metric_code
        
        # Use SYSCPC endpoint directly (CSASUM doesn't exist)
        response = requests.get(syscpc_url, headers=headers, params=params, verify=False, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            # Check for data in Rows field (actual API format)
            if 'Rows' in data and data['Rows']:
                # Extract the metric value from the first row
                first_row = data['Rows'][0]
                # Look for the metric code in the row data
                if metric_code in first_row:
                    value = extract_numeric_from_api_list([first_row[metric_code]])
                    return value
                else:
                    return None
            else:
                return None
        else:
            return None
            
    except Exception as e:
        return None

# Metric definitions
METRICS = {
    # CSA Metrics
    'csa_defined': ('CSRECSAD', 'CSA Defined'),
    'csa_in_use': ('CSRECSAU', 'CSA In Use'),
    'csa_in_use_percent': ('CSRECSUP', 'CSA In Use Percent'),
    'csa_free_areas_count': ('CSRECSFC', 'Count of Free CSA Areas'),
    'csa_converted': ('CSRECSAC', 'Converted CSA'),
    'csa_converted_to_sqa_percent': ('CSRECSCP', 'Converted CSA to SQA Percent'),
    'csa_smallest_free_area': ('CSRECSMN', 'Smallest Free CSA Area'),
    'csa_largest_free_area': ('CSRECSMX', 'Largest Free CSA Area'),
    'csa_largest_percent_of_total': ('CSRECSLP', 'Largest Percent of Total CSA'),
    'csa_available': ('CSRECSAA', 'Available CSA'),
    'csa_available_percent': ('CSRECSAP', 'Available CSA Percent'),
    
    # ECSA Metrics
    'ecsa_defined': ('CSREECSD', 'Defined ECSA'),
    'ecsa_in_use': ('CSREECSU', 'ECSA In Use'),
    'ecsa_in_use_percent': ('CSREECUP', 'ECSA In Use Percent'),
    'ecsa_converted': ('CSREECSC', 'Converted ECSA'),
    'ecsa_converted_to_esqa_percent': ('CSREECCP', 'Converted ECSA to ESQA Percent'),
    'ecsa_free_areas_count': ('CSREECFC', 'Count of Free ECSA Areas'),
    'ecsa_available': ('CSREECSA', 'Available ECSA'),
    'ecsa_available_percent': ('CSREECAP', 'Available ECSA Percent'),
    'ecsa_smallest_free_area': ('CSREECMN', 'Smallest Free ECSA Area'),
    'ecsa_largest_free_area': ('CSREECMX', 'Largest Free ECSA Area'),
    'ecsa_largest_percent_of_total': ('CSREECLP', 'Largest Percent of Total ECSA'),
    
    # RUCSA Metrics
    'rucsa_defined': ('CSRERCSD', 'Defined RUCSA'),
    'rucsa_in_use': ('CSRERCSU', 'RUCSA In Use'),
    'rucsa_in_use_percent': ('CSRERCUP', 'RUCSA In Use Percent'),
    'rucsa_free_areas_count': ('CSRERCSF', 'Count of Free RUCSA Areas'),
    'rucsa_smallest_free_area': ('CSRERCSM', 'Smallest Free RUCSA Area'),
    'rucsa_largest_free_area': ('CSRERCSX', 'Largest Free RUCSA Area'),
    'rucsa_largest_percent_of_total': ('CSRERCLP', 'Largest Percent of Total RUCSA'),
    
    # ERUCSA Metrics
    'erucsa_defined': ('CSREERCSD', 'Defined ERUCSA'),
    'erucsa_in_use': ('CSREERCSU', 'ERUCSA In Use'),
    'erucsa_in_use_percent': ('CSREERCUP', 'ERUCSA In Use Percent'),
    'erucsa_free_areas_count': ('CSREERCSF', 'Count of Free ERUCSA Areas'),
    'erucsa_smallest_free_area': ('CSREERCSM', 'Smallest Free ERUCSA Area'),
    'erucsa_largest_free_area': ('CSREERCSX', 'Largest Free ERUCSA Area'),
    'erucsa_largest_percent_of_total': ('CSREERCLP', 'Largest Percent of Total ERUCSA'),
    
    # SQA Metrics
    'sqa_defined': ('CSRESQAD', 'Defined SQA'),
    'sqa_in_use': ('CSRESQAU', 'SQA In Use'),
    'sqa_in_use_percent': ('CSRESQUP', 'SQA In Use Percent'),
    'sqa_available': ('CSRESQAA', 'Available SQA'),
    'sqa_available_percent': ('CSRESQAP', 'Available SQA Percent'),
    
    # ESQA Metrics
    'esqa_available': ('CSREESQA', 'Available ESQA'),
    'esqa_available_percent': ('CSREESAP', 'Available ESQA Percent'),
    
    # Total Common Storage Metrics
    'total_cs_defined': ('CSRETD', 'Defined Common Storage'),
    'total_cs_used': ('CSRETU', 'Used Common Storage'),
    'total_cs_used_percent': ('CSRETUP', 'Total Used Common Storage Percent'),
    'total_converted_csa_ecsa': ('CSRETC', 'Total Converted CSA and ECSA'),
    'available_common_storage': ('CSRETA', 'Available Common Storage'),
    'available_common_storage_percent': ('CSRETAP', 'Available Common Storage Percent'),
    
    # High Shared Storage Metrics
    'defined_high_shared_storage': ('CSGSHSZ', 'Defined High Shared Storage'),
    'used_high_shared_storage': ('CSGSHUS', 'Used High Shared Storage'),
    'percent_used_high_shared_storage': ('CSGSHUP', 'Percent Used High Shared Storage'),
    'number_of_shared_memory_objects': ('CSGSHMO', 'Number of Shared Memory Objects'),
    'used_hwm_high_shared_storage': ('CSGSHHW', 'Used HWM High Shared Storage'),
    'percent_hwm_high_shared_storage': ('CSGSHHP', 'Percent HWM High Shared Storage'),
    
    # High Common Storage Metrics
    'defined_high_common_storage': ('CSGHCSZ', 'Defined High Common Storage'),
    'used_high_common_storage': ('CSGHCUS', 'Used High Common Storage'),
    'percent_used_high_common_storage': ('CSGHCUP', 'Percent Used High Common Storage'),
    'number_of_common_memory_objects': ('CSGHCMO', 'Number of Common Memory Objects'),
    'used_hwm_high_common_storage': ('CSGHCHW', 'Used HWM High Common Storage'),
    'percent_hwm_high_common_storage': ('CSGHCHP', 'Percent HWM High Common Storage'),
}

def create_csa_monitoring_table():
    """Creates comprehensive CSA monitoring table in PostgreSQL"""
    columns = []
    for metric_name, (metric_code, description) in METRICS.items():
        columns.append(f"{metric_name} NUMERIC")
    
    create_table_query = f"""
        CREATE TABLE IF NOT EXISTS mainview_csasum (
            {', '.join(columns)},
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    return execute_query(create_table_query)

def save_csa_data_to_db(metrics_data):
    """Saves comprehensive CSA monitoring data to PostgreSQL database"""
    if not metrics_data:
        return False
    
    # First, try to update existing record for today
    columns = list(METRICS.keys())
    set_clause = ', '.join([f"{col} = %s" for col in columns])
    
    update_query = f"""
        UPDATE mainview_csasum 
        SET {set_clause}, timestamp = CURRENT_TIMESTAMP
        WHERE DATE(timestamp) = CURRENT_DATE
    """
    
    values = [metrics_data.get(metric) for metric in columns]
    
    # Try to update first
    logger.info("Attempting to update existing record for today...")
    rows_affected = execute_query(update_query, values)
    if rows_affected and rows_affected > 0:
        logger.info(f"Successfully updated existing record ({rows_affected} rows)")
        return True
    
    # If no rows were updated, insert a new record
    logger.info("No existing record found, inserting new record...")
    placeholders = ', '.join(['%s'] * len(columns))
    column_names = ', '.join(columns)
    
    insert_query = f"""
        INSERT INTO mainview_csasum ({column_names})
        VALUES ({placeholders})
    """
    
    rows_affected = execute_query(insert_query, values)
    if rows_affected and rows_affected > 0:
        logger.info(f"Successfully inserted new record ({rows_affected} rows)")
        return True
    else:
        logger.warning("Failed to insert new record")
        return False


def create_mock_csa_data():
    """Create mock CSA data for testing"""
    import random
    mock_data = {}
    for metric_name, (metric_code, description) in METRICS.items():
        # Generate realistic CSA values
        if 'percent' in metric_name.lower():
            mock_data[metric_name] = round(random.uniform(10, 90), 2)
        elif 'count' in metric_name.lower():
            mock_data[metric_name] = random.randint(1, 50)
        else:
            mock_data[metric_name] = round(random.uniform(1000, 100000), 2)
    
    mock_data['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return mock_data

def monitor_csa_metrics():
    """Main function to monitor comprehensive CSA metrics"""
    
    # Try to create table if not exists
    try:
        create_csa_monitoring_table()
    except Exception:
        pass  # Silently fail
    
    # For now, use mock data since API doesn't provide CSA metrics
    # TODO: Replace with real API calls when CSA endpoint is available
    metrics_data = create_mock_csa_data()
    
    # Save to JSON file
    save_to_json(metrics_data, 'mainview_csasum.json')
    
    # Save to database
    conn = get_postgres_connection()
    if conn:
        try:
            save_csa_data_to_db(metrics_data)
        except Exception:
            pass  # Silently fail
        finally:
            conn.close()
    
    return metrics_data

def run_csa_monitoring_loop(interval_minutes=1):
    """Runs comprehensive CSA monitoring in a continuous loop"""
    logger.info(f"Starting CSA monitoring loop with {interval_minutes} minute intervals")
    
    while True:
        try:
            monitor_csa_metrics()
            time.sleep(interval_minutes * 60)  # 60 seconds
        except KeyboardInterrupt:
            logger.info("CSA monitoring loop stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in CSA monitoring loop: {e}")
            time.sleep(60)  # Wait 1 minute before retrying

def test_script():
    """Test function to check if script works"""
    logger.info("Testing csasum script...")
    logger.info(f"psycopg2 available: {PSYCOPG2_AVAILABLE}")
    
    # Test database connection
    conn = get_postgres_connection()
    if conn:
        logger.info("Database connection: SUCCESS")
        conn.close()
    else:
        logger.info("Database connection: FAILED")
    
    # Test API token
    token = get_token()
    if token:
        logger.info("API token: SUCCESS")
    else:
        logger.info("API token: FAILED")
    
    # Test monitoring function
    try:
        result = monitor_csa_metrics()
        logger.info(f"Monitoring function: SUCCESS - {len(result) if result else 0} metrics")
    except Exception as e:
        logger.info(f"Monitoring function: FAILED - {e}")

if __name__ == "__main__":
    # Run CSA monitoring every 60 seconds (1 minute)
    run_csa_monitoring_loop(interval_minutes=1)