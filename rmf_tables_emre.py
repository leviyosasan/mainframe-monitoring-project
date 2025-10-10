#TRX,ASRM,SRSC python dosyalarının BİRLEŞMİŞ halidir.

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

logger = logging.getLogger(__name__)

# -------------------
# API URL'leri
# -------------------
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
trx_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/TRX/data"
srcs_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/SRCS/data"
asrm_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/ASRM/data"

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
                print(f"✅ API Token başarıyla alındı ve kaydedildi")
                return api_token
        print(f"❌ Token alınamadı! HTTP Durum Kodu: {response.status_code}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"❌ API Bağlantı Hatası: {e}")
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
        print("🔄 Token süresi dolmuş, yeni token alınıyor...")
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
        print("⚠️  UYARI: Toplu veri ekleme için veri bulunamadı!")
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
        print("✅ TRX tablosu (mainview_rmf_trx) başarıyla oluşturuldu/hazır")
    else:
        print("❌ TRX tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def asrm_create_table(): #ASRM tablosu oluşturur
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
        print("✅ ASRM tablosu (mainview_rmf_asrm) başarıyla oluşturuldu/hazır")
    else:
        print("❌ ASRM tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def srcs_create_table(): #SRCS tablosu oluşturur
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
        print("✅ SRCS tablosu (mainview_rmf_srcs) başarıyla oluşturuldu/hazır")
    else:
        print("❌ SRCS tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")


# -------------------
# DB'ye Yazma Fonksiyonları
# -------------------

def trx_process_row(rows): #TRX API yanıtını çeker ve veritabanına yazar
    if not isinstance(rows, list):
        print("⚠️  TRX API UYARISI: Beklenmedik veri formatı - satırlar liste formatında değil!")
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
            print(f"✅ TRX verisi başarıyla veritabanına eklendi (UTC: {bmctime.strftime('%H:%M:%S')})")
        else:
            print("❌ TRX verisi veritabanına eklenemedi! Veritabanı bağlantısını kontrol edin")

def srcs_process_row(rows): #SRCS API yanıtını çeker ve veritabanına yazar
    if not isinstance(rows, list):
        print("⚠️  SRCS API UYARISI: Beklenmedik veri formatı - satırlar liste formatında değil!")
        return

    for row in rows:
        bmctime = datetime.now(timezone.utc)
        time_t = datetime.now().replace(tzinfo=None, microsecond=0)

        # BIGINT alanları - ondalık kısmı kaldırılarak tamsayıya dönüştürülüyor
        splafcav_value = int(float(row.get("SPLAFCAV", 0)))
        # INTEGER alanları
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
        # FLOAT alanları
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
            print(f"✅ SRCS verisi başarıyla veritabanına eklendi (UTC: {bmctime.strftime('%H:%M:%S')})")
        else:
            print("❌ SRCS verisi veritabanına eklenemedi! Veritabanı bağlantısını kontrol edin")

def asrm_process_row(rows): #ASRM API yanıtını çeker ve veritabanına yazar #MANY QUERY
    if not isinstance(rows, list):
        logger.warning("Beklenmedik API formatı: Rows bir liste değil.")
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
        logger.warning("⚠️  ASRM: Eklenecek veri bulunamadı - API boş yanıt döndürdü")
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
        print(f"✅ ASRM verisi başarıyla veritabanına eklendi (UTC: {current_time.strftime('%H:%M:%S')}) - {len(data_list)} kayıt")
    else:
        print("❌ ASRM verisi veritabanına eklenemedi! Veritabanı bağlantısını kontrol edin")
    return success

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
            print("⚠️  TRX API'den veri gelmedi - API boş yanıt döndürdü")
    else:
        print(f"❌ TRX API Hatası: HTTP {response.status_code} - API erişimi başarısız")

def srcs_display(): #SRCS API yanıtını çeker
    global api_token
    check_and_refresh_token()
    headers, params = get_common_headers_and_params()
    response = requests.get(srcs_url, params=params, headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("SRCS DB: 401 hatası. Token yenilenip tekrar deneniyor.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(srcs_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token yenilenemedi. SRCS DB kaydı atlanıyor.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            srcs_process_row(rows)
        else:
            print("⚠️  SRCS API'den veri gelmedi - API boş yanıt döndürdü")
    else:
        print(f"❌ SRCS API Hatası: HTTP {response.status_code} - API erişimi başarısız")

def asrm_display(): #ASRM API yanıtını çeker
    global api_token
    check_and_refresh_token()
    headers,params = get_common_headers_and_params()
    response = requests.get(asrm_url,params=params,headers=headers, verify=False)
    if response.status_code == 401:
        logger.warning("ASMR DB: 401 hatası. Token yenilenip tekrar deneniyor.")
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response = requests.get(asrm_url, params=params, headers=headers, verify=False)
        else:
            logger.error("Token yenilenemedi. ASMR DB kaydı atlanıyor.")
            return
    if response.status_code == 200:
        data = response.json()
        rows = data.get("Rows", [])
        if rows:
            asrm_process_row(rows)
        else:
            print("⚠️  ASRM API'den veri gelmedi - API boş yanıt döndürdü")
    else:
        print(f"❌ ASRM API Hatası: HTTP {response.status_code} - API erişimi başarısız")


def main():
    trx_create_table()
    asrm_create_table()
    srcs_create_table()
    api_token = get_token()
    if not api_token:
        logger.error("Token alınamadı. Program sonlandırılıyor.")
        return
    while True:
        trx_display()
        asrm_display()
        srcs_display()
        print("📊 Tüm API'lerden veri toplandı. Sonraki veri toplama için 60 saniye bekleniyor...")
        time.sleep(60)

if __name__ == "__main__":
    main()
