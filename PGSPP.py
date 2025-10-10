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

# SSL uyarılarını kapat
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
pgspp_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/PGSPP/data"



# Global variables
api_token = None
token_expiry_time = None


# PostgreSQL bağlantı bilgileri
POSTGRES_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678',
    'connect_timeout': 5
}



# Logging konfigürasyonu
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mvs_monitoring.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# ==================== common Functions ====================

def get_postgres_connection():
    """Creates and returns a PostgreSQL connection"""
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None):
    """Executes a SQL query and returns the result"""
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
    """Retrieves the active token from the database"""
    query = """
        SELECT token, expires_at
        FROM mainview_api_tokens
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
    """Saves the new token to the database"""
    # Önce eski token'ları pasif yap
    deactivate_query = "UPDATE mv_api_tokens SET is_active = FALSE"
    execute_query(deactivate_query)  
    # Yeni token'ı ekle
    insert_query = """
        INSERT INTO mv_api_tokens (token, expires_at, is_active)
        VALUES (%s, %s, TRUE)
    """    
    if execute_query(insert_query, (token, expires_at)):
        return True
    else:
        return False

def get_token():
    """Retrieves the API token from the database"""
    global api_token, token_expiry_time
    # Önce DB'den token almayı dene
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # DB'deki token hala geçerli mi kontrol et
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            return api_token    
    # DB'de geçerli token yoksa yeni token al
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1238"
    }    
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)    
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")          
            if new_token:
                # Token süresini hesapla (15 dakika)
                expires_at = datetime.now(pytz.UTC) + timedelta(minutes=15)                
                # DB'ye kaydet
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
    """Returns the common headers and parameters"""
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
    """Checks the token expiration and refreshes it if necessary"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        return get_token()
    return api_token

def save_to_json(data, filename):
    """Saves the data to a JSON file (append mode)"""
    try:
        # Mevcut dosyayı oku (varsa)
        existing_data = []
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = []
        
        # Yeni veriyi ekle
        new_entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": data
        }
        existing_data.append(new_entry)
        
        # Dosyaya kaydet
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
        
        return filename
    except Exception as e:
        return None

def extract_numeric_from_api_list(raw_list):
    """Extracts numeric values from the API list and converts them to float"""
    if not isinstance(raw_list, list) or not raw_list:
        return 0.0
    first_item = raw_list[0]
    if isinstance(first_item, dict):
        try:
            # Sözlükten ilk değeri (value) almayı dener
            value_str = next(iter(first_item.values())) 
            return float(value_str)
        except (StopIteration, ValueError, TypeError):
            return 0.0
    try:
        # Doğrudan dize veya sayı ise dönüştürür
        return float(first_item)
    except (ValueError, TypeError):
        return 0.0

def fetch_api_data(url, view_name):
    """Fetches data from the API"""
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

# ==================== PGSPP FONKSİYONLARI ====================

def ensure_pgspp_table_schema():
    """Creates or updates the PGSPP table"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_pgspp (
            
            pdgnum VARCHAR(10),                    -- Page Data Set Number
            pdgtypc VARCHAR(20),                   -- Page Data Set Type
            pdgser VARCHAR(10),                    -- Volume Serial Number
            pdredevc VARCHAR(10),                  -- Device Number
            pdgstat VARCHAR(20),                   -- Page Data Set Status
            pdislupc DECIMAL(5,2),                 -- Page Slot In Use Percentage
            pdipxtav DECIMAL(10,3),                -- Average Page Transfer Time
            pdipiort DECIMAL(10,3),                -- I/O Request Rate
            pdippbav DECIMAL(10,3),                -- Average Pages per Burst
            pdgvioc VARCHAR(10),                   -- VIO Eligibility
            pdibsyPC DECIMAL(5,2),                 -- In Use Percentage
            pdgdsn VARCHAR(100),                   -- Page Data Set Name
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    execute_query(create_table_query)

def extract_pgspp_field_value(row, field_name):
    """Extracts the value of a specific field from the PGSPP row"""
    if field_name not in row:
        return None
    
    value = row[field_name]
    if isinstance(value, list) and value:
        # Liste formatındaki değerleri işle
        if isinstance(value[0], dict):
            # Sözlük formatındaki değerleri işle
            first_key = next(iter(value[0].keys()))
            return value[0][first_key]
        else:
            return value[0]
    return value

def insert_pgspp_data(rows):
    """Saves the PGSPP data to the database"""
    if not rows:
        return
    
    insert_query = """
        INSERT INTO mainview_rmf_pgspp (
            pdgnum, pdgtypc, pdgser, pdredevc, pdgstat, 
            pdislupc, pdipxtav, pdipiort, pdippbav, 
            pdgvioc, pdibsyPC, pdgdsn
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
    """
    
    for row in rows:
        try:
            # Alanları çıkar
            pdgnum = extract_pgspp_field_value(row, 'PDGNUM')
            pdgtypc = extract_pgspp_field_value(row, 'PDGTYPC')
            pdgser = extract_pgspp_field_value(row, 'PDGSER')
            pdredevc = extract_pgspp_field_value(row, 'PDREDEVC')
            pdgstat = extract_pgspp_field_value(row, 'PDGSTAT')
            pdislupc = extract_pgspp_field_value(row, 'PDISLUPC')
            pdipxtav = extract_pgspp_field_value(row, 'PDIPXTAV')
            pdipiort = extract_pgspp_field_value(row, 'PDIPIORT')
            pdippbav = extract_pgspp_field_value(row, 'PDIPPBAV')
            pdgvioc = extract_pgspp_field_value(row, 'PDGVIOC')
            pdibsyPC = extract_pgspp_field_value(row, 'PDIBSYPC')
            pdgdsn = extract_pgspp_field_value(row, 'PDGDSN')
            
            # Sayısal değerleri dönüştür
            try:
                pdislupc = float(pdislupc) if pdislupc is not None else None
            except (ValueError, TypeError):
                pdislupc = None
                
            try:
                pdipxtav = float(pdipxtav) if pdipxtav is not None else None
            except (ValueError, TypeError):
                pdipxtav = None
                
            try:
                pdipiort = float(pdipiort) if pdipiort is not None else None
            except (ValueError, TypeError):
                pdipiort = None
                
            try:
                pdippbav = float(pdippbav) if pdippbav is not None else None
            except (ValueError, TypeError):
                pdippbav = None
                
            try:
                pdibsyPC = float(pdibsyPC) if pdibsyPC is not None else None
            except (ValueError, TypeError):
                pdibsyPC = None
            
            params = (
                pdgnum, pdgtypc, pdgser, pdredevc, pdgstat,
                pdislupc, pdipxtav, pdipiort, pdippbav,
                pdgvioc, pdibsyPC, pdgdsn
            )
            
            execute_query(insert_query, params)
            
        except Exception as e:
            logger.error(f"PGSPP data saving error: {e}")
            continue

def get_pgspp_data():
    """Fetches the PGSPP data from the API"""
    if not check_and_refresh_token():
        logger.error("Token alınamadı")
        return None
    
    headers, params = get_common_headers_and_params()
    
    try:
        response = requests.get(pgspp_url, params=params, headers=headers, verify=False, timeout=30)
        
        if response.status_code == 401:
            logger.warning("401 error - Token refreshing...")
            if get_token():
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(pgspp_url, params=params, headers=headers, verify=False, timeout=30)
            else:
                logger.error("Token refreshing failed")
                return None
        
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            logger.error(f"PGSPP API error: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"PGSPP API connection error: {e}")
        return None

def pgspp_monitoring_cycle():
    """PGSPP monitoring cycle"""
    logger.info("PGSPP monitoring starting...")
    
    # PGSPP data fetch
    pgspp_data = get_pgspp_data()
    if pgspp_data is None:
        logger.error("PGSPP data not found")
        return
    
    # JSON dosyasına kaydet
    save_to_json(pgspp_data, "pgspp_monitoring_data.json")
    
    # Veritabanı tablosunu oluştur
    ensure_pgspp_table_schema()
    
    # Verileri işle ve kaydet
    rows = pgspp_data.get("Rows", [])
    if rows:
        insert_pgspp_data(rows)
        logger.info(f"✅ PGSPP: {len(rows)} records processed")
    else:
        logger.warning("⚠️ PGSPP: Data not found")

def pgspp_monitoring_thread():
    """PGSPP monitoring thread - 30 minutes"""
    while True:
        try:
            pgspp_monitoring_cycle()
            logger.info("⏰ PGSPP next check 30 minutes later...")
            time.sleep(30 * 60)  # 30 dakika bekle
        except KeyboardInterrupt:
            logger.info("⚠️ PGSPP Monitoring stopping...")
            break
        except Exception as e:
            logger.error(f"❌ PGSPP Monitoring error: {e}")
            logger.info("⏰ 5 minutes later, the check will be repeated...")
            time.sleep(5 * 60)  # Hata durumunda 5 dakika bekle

def main():
    """Main function - Starts the PGSPP monitoring service"""
    print("🚀 PGSPP Monitoring Service Starting...")
    print("📋 Features:")
    print("  • PGSPP: 30 minutes automatic control")
    print("  • PostgreSQL database saving")
    print("  • JSON file saving")
    print("\n💡 Press Ctrl+C to stop")
    
    # Token al
    if not get_token():
        print("❌ Token not found. Program stopping.")
        return
    
    # İlk çalıştırmayı hemen yap
    pgspp_monitoring_cycle()
    
    # Threading ile sürekli monitoring başlat
    pgspp_thread = threading.Thread(target=pgspp_monitoring_thread, daemon=True)
    pgspp_thread.start()
    
    print("✅ PGSPP Monitoring service started!")
    
    try:
        # Ana thread'i canlı tut
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n⚠️ PGSPP Monitoring Service stopping...")
        print("✅ Service stopped successfully")

if __name__ == "__main__":
    main()