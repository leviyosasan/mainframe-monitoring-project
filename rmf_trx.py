import psycopg2
import requests
import time
from datetime import datetime, timezone, timedelta
import logging
import urllib3
import json
import os

# SSL uyarılarını kapat
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# -------------------
# Global Sabitler ve PostgreSQL bağlantı ayarları
# -------------------
POSTGRES_CONFIG = {
    'host': '192.168.60.145',
    'port': 5432,
    'database': 'mainview',
    'user': 'postgres',
    'password': '12345678'
}

# Log Dosyası İsimleri
JSON_LOG_FILE_TRX = "mainframe-monitoring-project/rmf_trx_log.json"

# -------------------
# Logging konfigürasyonu
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mainframe-monitoring-project/rmf_trx.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URL'leri
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
trx_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/TRX/data"


api_token = None
token_expiry_time = None

# -------------------
# Ortak Yardımcı Fonksiyonlar
# -------------------
def get_postgres_connection(): #PostgreSQL bağlantısı oluşturur
    try:
        connection = psycopg2.connect(**POSTGRES_CONFIG)
        return connection
    except Exception as e:
        logger.error(f"PostgreSQL bağlantı hatası: {e}")
        return None

def execute_query(query, params=None): #Verilen sorguyu çalıştırır
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
        return False
    finally:
        if connection:
            connection.close()

def get_token(): #Token alınıyor
    global api_token, token_expiry_time
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = {"username": "VOBA", "password": "OZAN1238"}
    try:
        response = requests.post(logon_url, headers=headers, data=data, verify=False)
        if response.status_code == 200:
            response_json = response.json()
            new_token = response_json.get("userToken")
            if new_token:
                api_token = new_token
                token_expiry_time = datetime.now(timezone.utc) + timedelta(minutes=15)
                print(f"✅ Yeni token alındı")
                return api_token
        print(f"❌ Token alınamadı. Status: {response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Request hatası: {e}")
        return None

def get_common_headers_and_params(): #Token ile birlikte headers ve params oluşturur
    headers = {'Authorization': f'Bearer {api_token}'}
    params = {
        'context': 'ALL',
        'system': '*',
        'scope': '*',
        'row': '9999',
        'server': '*'
    }
    return headers, params

def check_and_refresh_token(): #Token süresi dolduysa yenileniyor
    global api_token, token_expiry_time
    if api_token is None or token_expiry_time is None or datetime.now(timezone.utc) >= token_expiry_time:
        print("🔄 Token süresi doldu, yenileniyor...")
        return get_token()
    return api_token

def extract_numeric_from_api_list(raw_list): #Bu fonksiyon, listenin içindeki tek sayısal değeri (string veya dict içinde olabilir) float'a dönüştürür.
    # Bu fonksiyon, listenin içindeki tek sayısal değeri (string veya dict içinde olabilir) float'a dönüştürür.
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

def execute_many(query, data_list):#Verilen sorguyu kullanarak birden fazla veriyi tek seferde veritabanına ekler
    if not data_list:
        print("Uyarı: Veritabanına yazılacak veri bulunamadı.")
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
        logger.info(f"Toplam {len(data_list)} adet veri başarıyla veritabanına eklendi.")
        return True
    except Exception as e:
        logger.error(f"Toplu ekleme (executemany) hatası: {e}")
        if connection:
            connection.rollback()
        return False
    finally:
        if connection:
            connection.close()

def append_to_json_log(data_to_log, log_file): #JSON dosyasını okur yeni veriyi ekler ve baştan yazar
    """ Mevcut JSON dosyasını okur, yeni veriyi ekler ve baştan yazar (indent=4). """
    
    log_entry = {
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "data": data_to_log
    }

    logs = []
    try:
        # Mevcut veriyi oku
        with open(log_file, 'r', encoding='utf-8') as file:
            logs = json.load(file)
        if not isinstance(logs, list):
            # Geçerli JSON ama liste değilse
            logs = [logs] 
    except (FileNotFoundError, json.JSONDecodeError):
        # Dosya yoksa veya bozuksa, sıfırla
        logger.warning(f"{log_file} başlatılıyor veya sıfırlanıyor.")
        logs = []

    # Yeni veriyi listeye ekle
    logs.append(log_entry)
    
    # Tüm listeyi okunabilir formatta (indent=4) baştan yaz
    try:
        with open(log_file, 'w', encoding='utf-8') as file:
            json.dump(logs, file, ensure_ascii=False, indent=4)
        print(f"✅ Loglama tamamlandı: {log_file}")
        logger.info(f"Loglama tamamlandı: {log_file}")
    except Exception as e:
        logger.error(f"JSON dosyasına yazma hatası ({log_file}): {e}")

# -------------------
# Tablo Oluşturma
# -------------------
def trx_create_table(): #TRX tablosu oluşturur
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
        print("✅ mainview_rmf_trx tablosu hazır")
    else:
        print("❌ Tablo oluşturulamadı")


# -------------------
# DB'ye Yazma Fonksiyonları
# -------------------

def trx_process_row(rows): #TRX API yanıtını çeker ve veritabanına yazar
    if not isinstance(rows, list):
        print("⚠️ Beklenmedik API formatı: Rows bir liste değil.")
        return

    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # String alanlar
        mxgcnm_value = str(row.get("MXGCNM", ""))
        mxgcpn_value = str(row.get("MXGCPN", ""))
        mxgtypc_value = str(row.get("MXGTYPC", ""))
        
        # Float alanlar
        mxiasac_value = float(row.get("MXIASAC", 0))
        mxixavg_value = extract_numeric_from_api_list(row.get("MXIXAVG", []))
        
        # Integer alanlar
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
            print(f"✅ Veri eklendi → TRX (UTC: {bmctime})")
        else:
            print(f"❌ Veri eklenemedi → TRX")

# -------------------
# Veri Çekme Fonksiyonları
# ------------------

def trx_display(): #TRX API yanıtını çeker
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(trx_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("TRX DB: 401 hatası. Token yenilenip tekrar deneniyor.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(trx_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token yenilenemedi. TRX DB kaydı atlanıyor.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            trx_process_row(rows)
        else:
            print("⚠️ API’den satır gelmedi")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Loglama Fonksiyonları
# -------------------

def trx_save_json(): #TRX API yanıtını çekip tüm veriyi log dosyasına kaydeder.
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    try:
        response = requests.get(trx_url, params=params, headers=headers, verify=False)
        if response.status_code == 401:
            logger.warning("TRX DB: 401 hatası. Token yenilenip tekrar deneniyor.")
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(trx_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token yenilenemedi. TRX DB kaydı atlanıyor.")
                return
        if response.status_code == 200:
            data = response.json()
            append_to_json_log(data, JSON_LOG_FILE_TRX)
        else:
            logger.error(f"TRX API hatası: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"TRX Request hatası: {e}")
        print(f"❌ Request hatası: {e}")

# -------------------
# Ana fonksiyon
# -------------------
def main():
    trx_create_table() #TRX tablosu oluşturur
    api_token = get_token()
    if not api_token:
        print("❌ Token alınamadı. Program sonlandırılıyor.")
        return
    while True:
        trx_display() #TRX API yanıtını çeker
        trx_save_json() #JSON dosyası oluşturuyor
        logger.info("Yeni veri için 60 saniye bekleniyor...")
        time.sleep(60) #1 dakika bekler
if __name__ == "__main__":
    main()