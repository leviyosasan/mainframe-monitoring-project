import requests
import time
import json
import os
import logging
import psycopg2
from psycopg2 import sql
from datetime import datetime, timedelta

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
        'username': "VOBA",
        'password': "OZAN1238" 
    }
}

# Veritabanı tablo adları
TABLE_WMSPLXZ = "mainview_mvs_wmsplxz"
TABLE_JESPOOL = "mainview_mvs_jespool"

# API URL'leri
LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
WMSPLXZ_DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/WMSPLXZ/data"
JESPOOL_DATA_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JESPOOL/data"

# Global değişkenler
api_token = None
MAX_ERRORS = 5
error_count_jespool = 0
error_count_wmsplxz = 0

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

# --- VERİ ÇEKME ---
def fetch_api_data(url, view_name):
    if not api_token:
        logging.error(f"Token olmadan '{view_name}' verisi çekilemiyor.")
        return None
    headers = {'Authorization': f'Bearer {api_token}'}
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        logging.info(f"✅ API'den '{view_name}' verisi başarıyla çekildi.")
        return api_data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            logging.warning("⚠️ Token süresi dolmuş veya geçersiz. Yeniden kimlik doğrulaması yapılacak.")
            return 'reauth'
        logging.error(f"❌ '{view_name}' API hatası: HTTP {e.response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ '{view_name}' veri çekme hatası: {e}")
        return None

# --- WMSPLXZ KAYDETME FONKSİYONU ---
def save_wmsplxz_data(data):
    global error_count_wmsplxz
    logging.info("--- WMSPLXZ VERİ İŞLEME ---")
    if not data or not isinstance(data, dict) or 'Rows' not in data:
        logging.warning("❌ Geçersiz veya boş WMSPLXZ verisi alındı. 'Rows' anahtarı bekleniyor.")
        error_count_wmsplxz += 1
        return False

    records = data.get('Rows')
    if not records or not isinstance(records, list) or len(records) == 0:
        logging.warning("❌ WMSPLXZ verisi işlenemedi. 'Rows' anahtarı altında liste bekleniyor.")
        error_count_wmsplxz += 1
        return False
    
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
        logging.info(f"✅ {len(records)} WMSPLXZ kaydı veritabanına başarıyla eklendi.")
        error_count_wmsplxz = 0
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Veritabanı hatası: {error}")
        error_count_wmsplxz += 1
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logging.info("Veritabanı bağlantısı kapatıldı.")

# --- JESPOOL KAYDETME FONKSİYONU ---
def save_jespool_data(data):
    global error_count_jespool
    logging.info("--- JESPOOL VERİ İŞLEME ---")
    if not data or 'Rows' not in data or not data['Rows']:
        logging.warning("❌ Geçersiz veya boş JESPOOL verisi alındı.")
        error_count_jespool += 1
        return False

    records = data['Rows']
    
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        cursor = conn.cursor()
        logging.info("Veritabanına bağlantı başarılı.")
        
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
            logging.info(f"✅ {records_added} JESPOOL kaydı veritabanına başarıyla eklendi.")
            error_count_jespool = 0
        else:
            logging.info("ℹ️ JESPOOL için yeni kayıt bulunamadı.")
        return True
    except (Exception, psycopg2.DatabaseError) as error:
        logging.error(f"❌ Veritabanı hatası: {error}")
        error_count_jespool += 1
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logging.info("Veritabanı bağlantısı kapatıldı.")

# --- ANA FONKSİYON ---
def main():
    global api_token, last_wmsplxz_run, error_count_jespool, error_count_wmsplxz
    
    if not get_token():
        logging.error("Token alınamadı. Program sonlandırılıyor.")
        return

    JESPOOL_INTERVAL_SECONDS = 60
    WMSPLXZ_INTERVAL_SECONDS = 2 * 60 * 60
    
    # JESPOOL ve WMSPLXZ'nin ilk çalıştırmada hemen başlamaları için zamanı geçmişe ayarla
    last_jespool_run = datetime.now() - timedelta(seconds=JESPOOL_INTERVAL_SECONDS)
    last_wmsplxz_run = datetime.now() - timedelta(seconds=WMSPLXZ_INTERVAL_SECONDS)

    while True:
        try:
            # JESPOOL verilerini 60 saniyede bir işle
            if (datetime.now() - last_jespool_run).total_seconds() >= JESPOOL_INTERVAL_SECONDS:
                logging.info("\n" + "="*40 + "\n--- JESPOOL Verileri İşleniyor (60 saniye döngüsü) ---")
                
                jespool_data = fetch_api_data(JESPOOL_DATA_URL, "JESPOOL")
                if jespool_data == 'reauth':
                    if not get_token():
                        logging.error("Yeniden token alma başarısız. Program sonlandırılıyor.")
                        return
                    jespool_data = fetch_api_data(JESPOOL_DATA_URL, "JESPOOL")
                
                if jespool_data:
                    save_jespool_data(jespool_data)
                
                last_jespool_run = datetime.now()

            # WMSPLXZ verilerini 2 saatte bir işle
            if (datetime.now() - last_wmsplxz_run).total_seconds() >= WMSPLXZ_INTERVAL_SECONDS:
                logging.info("\n" + "="*40 + "\n--- WMSPLXZ Verileri İşleniyor (2 saatlik döngü) ---")
                
                wmsplxz_data = fetch_api_data(WMSPLXZ_DATA_URL, "WMSPLXZ")
                if wmsplxz_data == 'reauth':
                    if not get_token():
                        logging.error("Yeniden token alma başarısız. Program sonlandırılıyor.")
                        return
                    wmsplxz_data = fetch_api_data(WMSPLXZ_DATA_URL, "WMSPLXZ")
                
                if wmsplxz_data:
                    save_wmsplxz_data(wmsplxz_data)
                
                last_wmsplxz_run = datetime.now()
            
            if error_count_jespool >= MAX_ERRORS or error_count_wmsplxz >= MAX_ERRORS:
                logging.error(f"🔴 Maksimum hata sayısına ulaşıldı. JESPOOL hataları: {error_count_jespool}, WMSPLXZ hataları: {error_count_wmsplxz}. Program sonlandırılıyor.")
                return

            # Kontrol döngüsü için bekleme süresi (60 saniye)
            # Düzeltme: 10 saniyelik mikro bekleme yerine 60 saniyelik ana bekleme.
            logging.info(f"⏳ 60 saniye bekleniyor... ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
            time.sleep(60)

        except KeyboardInterrupt:
            logging.info("🛑 Kullanıcı tarafından durduruldu.")
            break
        except Exception as e:
            logging.error(f"❌ Beklenmeyen bir hata oluştu: {e}")
            time.sleep(30)

if __name__ == "__main__":
    main()