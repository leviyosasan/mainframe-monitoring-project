import psycopg2
import requests
import time
import json
import threading
from datetime import datetime, timedelta
import logging
import pytz

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"


# Global variables
api_token = None
token_expiry_time = None

# PostgreSQL connection information
POSTGRES_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678',
    'connect_timeout': 5
}

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

# ==================== COMMON FUNCTIONS ====================

def get_postgres_connection():
    """PostgreSQL connection is created and returned"""
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL connection error: {e}")
        return None

def execute_query(query, params=None):
    """SQL query is executed and the result is returned"""
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
    """Active token is retrieved from the database"""
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
            print(f"✅ Token retrieved from the database, expiration time: {expires_at}")
            return token, expires_at
        else:
            print("⚠️ Active token not found in the database")
            return None, None          
    except Exception as e:
        logger.error(f"Token DB error: {e}")
        return None, None
    finally:
        if connection:
            connection.close()

def save_token_to_db(token, expires_at):
    """active token is saved to the database"""
    # Önce eski token'ları pasif yap
    deactivate_query = "UPDATE mv_api_tokens SET is_active = FALSE"
    execute_query(deactivate_query)  
    # Yeni token'ı ekle
    insert_query = """
        INSERT INTO mv_api_tokens (token, expires_at, is_active)
        VALUES (%s, %s, TRUE)
    """    
    if execute_query(insert_query, (token, expires_at)):
        print(f"✅ Token saved to the database, expiration time: {expires_at}")
        return True
    else:
        print("❌ Token not saved to the database")
        return False

def get_token():
    """API token is retrieved from the database"""
    global api_token, token_expiry_time
    # Önce DB'den token almayı dene
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # DB'deki token hala geçerli mi kontrol et
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            print(f"✅ Valid token retrieved from the database")
            return api_token    
    # DB'de geçerli token yoksa yeni token al
    print("🔄 New token is being retrieved...")    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1239"
    }    
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)    
        print(f"Response Status: {response.status_code}")        
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")          
            if new_token:
                # Token süresini hesapla (15 dakika)
                expires_at = datetime.now() + timedelta(minutes=15)                
                # DB'ye kaydet
                if save_token_to_db(new_token, expires_at):
                    api_token = new_token
                    token_expiry_time = expires_at
                    print(f"✅ New token retrieved and saved to the database")
                    return api_token
                else:
                    print("❌ Token not saved to the database")
                    return None
            else:
                print("❌ Token not found")
                return None
        else:
            print(f"❌ Token not retrieved. Status: {response.status_code}")
            return None            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None
    except ValueError as e:
        print(f"❌ JSON parse error: {e}")
        return None

def get_common_headers_and_params():
    """Common headers and parameters are returned"""
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

def save_to_json(data, filename):
    """Data is saved to the JSON file (append mode)"""
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
        print(f"❌ File saving error: {e}")

def main():
    """main function - Monitoring services are started"""
    print("🚀 MVS Monitoring Service is starting...")
    print("📋 Features:")
    print("  • PostgreSQL data saving")
    print("  • JSON file saving")
    print("  • Many query optimized data retrieval")
    print("\n💡 Press Ctrl+C to stop")


    # Token retrieve
    if not get_token():
        print("❌ Token not retrieved. Program is stopping.")
        return
    
    # First run immediately
    
    
    
    
    print("✅ Monitoring services started!")
    
    try:
        # Main thread keeps running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n⚠️ MVS Monitoring Service is stopping...")
        print("✅ Service stopped successfully")


if __name__ == "__main__":
    main()        