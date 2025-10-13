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
JSON_LOG_FILE_CENTRAL = "mainframe-monitoring-project/frminfo_central_log.json"

# -------------------
# Logging konfigürasyonu
# -------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('mainframe-monitoring-project/frminfo_central.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# -------------------
# API URL'leri
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
frminfo_central_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/FRMINFO/data"


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
def frminfo_central_create_table(): #FRMINFO_CENTRAL tablosu oluşturur
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_frminfo_central (
        id SERIAL PRIMARY KEY,
        spispcav NUMERIC,
        spispcmn NUMERIC,
        spispcmx NUMERIC,
        spilpfav NUMERIC,
        spilpfmn NUMERIC,
        spilpfmx NUMERIC,
        spicpfav NUMERIC,
        spicpfmn NUMERIC,
        spicpfmx NUMERIC,
        spiqpcav NUMERIC,
        spiqpcmn NUMERIC,
        spiqpcmx NUMERIC,
        spiapfav NUMERIC,
        spiapfmn NUMERIC,
        spiapfmx NUMERIC,
        spiafcav NUMERIC,
        spiafcmn NUMERIC,
        spitfuav NUMERIC,
        spiafumn NUMERIC,
        spiafumx NUMERIC,
        spitcpct NUMERIC,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    if execute_query(create_query):
        print("✅ mainview_frminfo_central tablosu hazır")
    else:
        print("❌ Tablo oluşturulamadı")

# -------------------
# DB'ye Yazma Fonksiyonları
# -------------------
def frminfo_central_process_row(rows): #FRMINFO_CENTRAL API yanıtını çeker ve veritabanına yazar
    if not isinstance(rows, list):
        logger.warning("Beklenmedik API formatı: Rows bir liste değil.")
        return False
    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        spispcav_value = float(row.get("SPISPCAV", 0))
        spispcmn_value = float(row.get("SPISPCMN", 0))
        spispcmx_value = float(row.get("SPISPCMX", 0))

        spilpfav_value = float(row.get("SPILPFAV", 0))
        spilpfmn_value = float(row.get("SPILPFMN", 0))
        spilpfmx_value = float(row.get("SPILPFMX", 0))

        spicpfav_value = float(row.get("SPICPFAV", 0))
        spicpfmn_value = float(row.get("SPICPFMN", 0))
        spicpfmx_value = float(row.get("SPICPFMX", 0))

        spiqpcav_value = float(row.get("SPIQPCAV", 0))
        spiqpcmn_value = float(row.get("SPIQPCMN", 0))
        spiqpcmx_value = float(row.get("SPIQPCMX", 0))

        spiapfav_value = float(row.get("SPIAPFAV", 0))
        spiapfmn_value = float(row.get("SPIAPFMN", 0))
        spiapfmx_value = float(row.get("SPIAPFMX", 0))

        spiafcav_value = float(row.get("SPIAFCAV", 0))
        spiafcmn_value = float(row.get("SPIAFCMN", 0))

        spitfuav_value = float(row.get("SPITFUAV", 0))
        spiafumn_value = float(row.get("SPIAFUMN", 0))
        spiafumx_value = float(row.get("SPIAFUMX", 0))

        spitcpct_value = float(row.get("SPITCPCT", 0))


        insert_query = """
            INSERT INTO mainview_frminfo_central (
                spispcav, spispcmn, spispcmx,
                spilpfav, spilpfmn, spilpfmx,
                spicpfav, spicpfmn, spicpfmx,
                spiqpcav, spiqpcmn, spiqpcmx,
                spiapfav, spiapfmn, spiapfmx,
                spiafcav, spiafcmn, spitfuav,
                spiafumn, spiafumx, spitcpct,
                bmctime, "time"
            ) VALUES (%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s, %s,%s, %s)
        """

        frminfo_central_params = (
            spispcav_value, spispcmn_value, spispcmx_value,
            spilpfav_value, spilpfmn_value, spilpfmx_value, spicpfav_value,
            spicpfmn_value, spicpfmx_value, spiqpcav_value, spiqpcmn_value,
            spiqpcmx_value, spiapfav_value, spiapfmn_value, spiapfmx_value,
            spiafcav_value, spiafcmn_value, spitfuav_value, spiafumn_value,
            spiafumx_value, spitcpct_value,bmctime, time_t
        )

        if execute_query(insert_query, frminfo_central_params):
            print(f"✅ Veri eklendi → FRMINFO_CENTRAL (UTC: {bmctime})")
        else:
            print(f"❌ Veri eklenemedi → FRMINFO_CENTRAL")

# -------------------
# Veri Çekme Fonksiyonları
# ------------------

def frminfo_central_display(): #FRMINFO_CENTRAL API yanıtını çeker
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("FRMINFO_CENTRAL DB: 401 hatası. Token yenilenip tekrar deneniyor.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token yenilenemedi. FRMINFO_CENTRAL DB kaydı atlanıyor.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            frminfo_central_process_row(rows)
        else:
            print("⚠️ API’den satır gelmedi")
    else:
        print(f"❌ Response error: {response.status_code}")

# -------------------
# Loglama Fonksiyonları
# -------------------

def frminfo_central_save_json(): #FRMINFO_CENTRAL API yanıtını çekip tüm veriyi log dosyasına kaydeder.
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    try:
        response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
        if response.status_code == 401:
            logger.warning("FRMINFO_CENTRAL DB: 401 hatası. Token yenilenip tekrar deneniyor.")
            api_token = get_token()
            if api_token:
                headers = {'Authorization': f'Bearer {api_token}'}
                response = requests.get(frminfo_central_url, params=params, headers=headers, verify=False)
            else:
                logger.error("Token yenilenemedi. FRMINFO_CENTRAL DB kaydı atlanıyor.")
                return
        if response.status_code == 200:
            data = response.json()
            append_to_json_log(data, JSON_LOG_FILE_CENTRAL)
        else:
            logger.error(f"FRMINFO_CENTRAL API hatası: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.error(f"FRMINFO_CENTRAL Request hatası: {e}")
        print(f"❌ Request hatası: {e}")    


# -------------------
# Ana fonksiyon
# -------------------

def main():
    global api_token
    frminfo_central_create_table() #FRMINFO_CENTRAL tablosu oluşturur
    api_token = get_token()
    if not api_token:
        logger.error("Token alınamadı. Program sonlandırılıyor.")
        return
    logger.info("Program başlatıldı - 60 saniye aralıklarla veri toplanıyor.")
    while True: 
        frminfo_central_display() #FRMINFO_CENTRAL API yanıtını çeker
        #frminfo_central_save_json() #JSON DOSYASI OLUŞTURUYOR
        logger.info("Yeni veri için 60 saniye bekleniyor...")
        time.sleep(60)  # 1 dakika aralık

if __name__ == "__main__":
    main()  