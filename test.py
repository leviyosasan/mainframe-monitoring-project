import psycopg2
import requests
import time
import json
import threading
from datetime import datetime, timedelta, timezone
import logging
import pytz
import urllib3
 
# SSL uyarılarını kapat
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
 
# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
cpu_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JC…
zfs_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/ZF…
sysover_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SY…
cpuhiper_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/CP…
 
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
 
# ANSI Renk kodları
ANSI_GREEN = "\x1b[32m"
ANSI_BLUE = "\x1b[34m"
ANSI_YELLOW = "\x1b[33m"
ANSI_RED = "\x1b[31m"
ANSI_WHITE = "\x1b[37m"
ANSI_RESET = "\x1b[0m"
 
# ==================== ORTAK FONKSİYONLAR ====================
 
def get_postgres_connection():
    """PostgreSQL bağlantısı oluşturur ve döndürür"""
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL bağlantı hatası: {e}")
        return None
 
def execute_query(query, params=None):
    """SQL query çalıştırır ve sonucu döndürür"""
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
        logger.error(f"Query hatası: {e}")
        try:
            logger.error(f"Sorgu: {query}")
            logger.error(f"Parametreler: {params}")
        except Exception:
            pass
        return False
    finally:
        if connection:
            connection.close()
 
def get_token_from_db():
    """Veritabanından aktif token'ı alır"""
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
            print(f"✅ DB'den token alındı, süre: {expires_at}")
            return token, expires_at
        else:
            print("⚠️ DB'de aktif token bulunamadı")
            return None, None          
    except Exception as e:
        logger.error(f"Token DB hatası: {e}")
        return None, None
    finally:
        if connection:
            connection.close()
 
def save_token_to_db(token, expires_at):
    """Yeni token'ı veritabanına kaydeder"""
    # Önce eski token'ları pasif yap
    deactivate_query = "UPDATE mv_api_tokens SET is_active = FALSE"
    execute_query(deactivate_query)  
    # Yeni token'ı ekle
    insert_query = """
        INSERT INTO mv_api_tokens (token, expires_at, is_active)
        VALUES (%s, %s, TRUE)
    """    
    if execute_query(insert_query, (token, expires_at)):
        print(f"✅ Token DB'ye kaydedildi, süre: {expires_at}")
        return True
    else:
        print("❌ Token DB'ye kaydedilemedi")
        return False
 
def get_token():
    """API token alır - DB entegreli"""
    global api_token, token_expiry_time
    # Önce DB'den token almayı dene
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # DB'deki token hala geçerli mi kontrol et
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            print(f"✅ DB'den geçerli token kullanılıyor")
            return api_token    
    # DB'de geçerli token yoksa yeni token al
    print("🔄 Yeni token alınıyor...")    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        "username": "VOBA",
        "password": "OZAN1238"
    }    
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)    
        print(f"Response Status: {response.status_code}")        
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
                    print(f"✅ Yeni token alındı ve DB'ye kaydedildi")
                    return api_token
                else:
                    print("❌ Token DB'ye kaydedilemedi")
                    return None
            else:
                print("❌ Token bulunamadı")
                return None
        else:
            print(f"❌ Token alınamadı. Status: {response.status_code}")
            return None            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request hatası: {e}")
        return None
    except ValueError as e:
        print(f"❌ JSON parse hatası: {e}")
        return None
 
def get_common_headers_and_params():
    """Ortak header ve parametreleri döndürür"""
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
    """Token süresini kontrol eder ve gerekirse yeniler"""
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(pytz.UTC) >= token_expiry_time:
        print("🔄 Token süresi doldu, yenileniyor...")
        return get_token()
    return api_token
 
def save_to_json(data, filename):
    """Veriyi JSON dosyasına kaydeder (append mode)"""
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
       
        print(f"✅ Veriler {filename} dosyasına kaydedildi (Toplam {len(existing_data)} kayıt)")
        return filename
    except Exception as e:
        print(f"❌ Dosya kaydetme hatası: {e}")
        return None
 
def extract_numeric_from_api_list(raw_list):
    """API'den gelen liste formatındaki sayısal değerleri float'a dönüştürür"""
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

