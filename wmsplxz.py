import requests
import time
import json
import os
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime

# --- LOG AYARLARI ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# --- KONFİGÜRASYON (AYARLAR) ---
CONFIG = {
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
        'password': "OZAN1238"
    }
}

TABLE_NAME = "mainview_mvs_wmsplxz"


LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/WMSPLXZ/data"

api_token = None

# --- TOKEN ALMA ---
def get_token():
    global api_token
    logging.info("--- TOKEN İŞLEMLERİ ---")
    logging.info("🔄 Yeni token alınıyor...")
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
            logging.info("✅ Token başarıyla alındı.")
            return True
        else:
            logging.error("❌ Token bulunamadı. Yanıt: %s", response.text)
            return False
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ İstek hatası: {e}")
        return False
    except ValueError as e:
        logging.error(f"❌ JSON çözümleme hatası: {e}")
        return False

def fetch_wmsplxz_data():
    if not api_token:
        logging.error("Token olmadan veri çekilemiyor.")
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(DATA_URL, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info("✅ API'den 'WMSPLXZ' verisi başarıyla çekildi.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token süresi dolmuş veya geçersiz. Yeni token alınacak.")
            return 'reauth'
        logging.error(f"❌ HTTP hatası: {e}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Veri çekme hatası: {e}")
        return None

def save_wmsplxz_data(data):
    logging.info("--- WMSPLXZ VERİ İŞLEME ---")
    if not data:
        logging.warning("❌ Geçersiz veya boş WMSPLXZ verisi alındı.")
        return
    
    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ WMSPLXZ verisi işlenemedi. 'Rows' anahtarı altında liste bekleniyor.")
        return
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        cursor = conn.cursor()
        logging.info("Veritabanına bağlantı başarılı.")
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
                    logging.warning(f"⚠️ Geçersiz zaman formatı: '{install_datetime_str}'. NULL olarak kaydediliyor.")
            
            activate_datetime = None
            if activate_datetime_str:
                try:
                    activate_datetime = datetime.strptime(activate_datetime_str.split('.')[0], '%Y/%m/%d %H:%M:%S')
                except ValueError:
                    logging.warning(f"⚠️ Geçersiz zaman formatı: '{activate_datetime_str}'. NULL olarak kaydediliyor.")
            
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
        logging.info(f"✅ {len(records)} WMSPLXZ kaydı veritabanına başarıyla eklendi.")
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Veritabanı hatası: {error}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logging.info("Veritabanı bağlantısı kapatıldı.")

def main():
    global api_token
    
    if not get_token():
        logging.error("Token alınamadı. Program sonlandırılıyor.")
        return

    sleep_time = 2 * 60 * 60 
    while True:
        logging.info("\n--- WMSPLXZ Verileri İşleniyor (2 saatlik döngü) ---")
        wmsplxz_data = fetch_wmsplxz_data()
        
        if wmsplxz_data == 'reauth':
            if not get_token():
                logging.error("Yeniden token alma başarısız. Program sonlandırılıyor.")
                return
            wmsplxz_data = fetch_wmsplxz_data()
        
        if wmsplxz_data:
            save_wmsplxz_data(wmsplxz_data)
        
        logging.info(f"⏳ 2 saat bekleniyor... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
        time.sleep(sleep_time)

if __name__ == "__main__":
    main()