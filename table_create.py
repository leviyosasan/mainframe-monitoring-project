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

# API Configuration
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"

# PostgreSQL connection information
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
            return token, expires_at
        else:
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
        return True
    else:
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
        
        return filename
    except Exception as e:
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



def create_zfs_table():
    """mainview_zfs_file_systems tablosunu oluşturur"""
    # Önce mevcut tabloyu sil (eğer varsa)
    drop_table_query = "DROP TABLE IF EXISTS mainview_zfs_file_systems;"
    
    create_table_query = """
    CREATE TABLE mainview_zfs_file_systems (
        id SERIAL PRIMARY KEY,
        zfs_file_system_name VARCHAR(255) NOT NULL,
        system_name VARCHAR(50),
        owning_system VARCHAR(50),
        total_aggregate_size BIGINT,
        aggregate_used_percent DECIMAL(5,2),
        mount_mode VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        cursor.execute(drop_table_query)
        cursor.execute(create_table_query)
        connection.commit()
        cursor.close()
        print("✅ mainview_zfs_file_systems tablosu oluşturuldu")
        return True
        
    except Exception as e:
        print(f"❌ Tablo oluşturma hatası: {e}")
        return False
    finally:
        if connection:
            connection.close()

def ensure_pgspp_table_schema():
    """Creates or updates the PGSPP table"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_pgspp (
            id SERIAL PRIMARY KEY,
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


def ensure_table_schema():
    create_table_sql = """
        CREATE TABLE IF NOT EXISTS mainview_mvs_jcpu (
            id SERIAL PRIMARY KEY,
            Jobname VARCHAR(50),
            JES_Job_Number VARCHAR(50),
            Service_Class_Name VARCHAR(50),
            ALL_CPU_seconds DOUBLE PRECISION,
            Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION,
            Using_CPU_Percentage DOUBLE PRECISION,
            time TIMESTAMP,
            bmctime TIME
        )
    """
    execute_query(create_table_sql)
    alter_statements = [
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Jobname VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS JES_Job_Number VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Service_Class_Name VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS ALL_CPU_seconds DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Using_CPU_Percentage DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS time TIMESTAMP",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS bmctime TIME"
    ]
    for stmt in alter_statements:
        execute_query(stmt)


def create_ard_table():
    """mainview_ard_performance table is created - SYSOVER fields"""
    # Önce mevcut tabloyu sil (eğer varsa)
    drop_table_query = "DROP TABLE IF EXISTS mainview_rmf_ard;"
    
    create_table_query = """
    CREATE TABLE mainview_rmf_ard (
        id SERIAL PRIMARY KEY,
        jobname VARCHAR(255),
        device_connection_time_seconds NUMERIC,
        current_fixed_frames_16m NUMERIC,
        current_fixed_frame_count NUMERIC,
        cross_memory_register VARCHAR(1),
        session_srm_service_absorption_rate NUMERIC,
        session_cpu_seconds_tcb_mode NUMERIC,
        cpu_seconds NUMERIC,
        excp_rate_per_second NUMERIC,
        swap_page_rate_per_second NUMERIC,
        interval_lpa_page_rate NUMERIC,
        interval_csa_page_in_rate NUMERIC,
        realtime_non_vio_page_rate NUMERIC,
        private_vio_hiperspace_page_rate NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    connection = None
    try:
        connection = get_postgres_connection()
        if connection is None:
            return False
        
        cursor = connection.cursor()
        cursor.execute(drop_table_query)
        cursor.execute(create_table_query)
        connection.commit()
        cursor.close()
        print("✅ mainview_rmf_ard table created")
        return True
        
    except Exception as e:
        print(f"❌ Table creation error: {e}")
        return False
    finally:
        if connection:
            connection.close()

def trx_create_table():
    """TRX tablosu oluşturur"""
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

def asrm_create_table():
    """ASRM tablosu oluşturur"""
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

def srcs_create_table():
    """SRCS tablosu oluşturur"""
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

def sysover_create_table():
    """SYSOVER tablosu oluşturur"""
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_sysover (
        id SERIAL PRIMARY KEY,
        syxsysn TEXT,
        succpub NUMERIC,
        sucziib NUMERIC,
        scicpavg NUMERIC,
        suciinrt NUMERIC,
        suklqior NUMERIC,
        sukadbpc NUMERIC,
        csrecspu NUMERIC,
        csreecpu NUMERIC,
        csresqpu NUMERIC,
        csreespu NUMERIC,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    if execute_query(create_query):
        print("✅ mainview_mvs_sysover tablosu hazır")
    else:
        print("❌ Tablo oluşturulamadı")

def cpuhiper_create_table():
    """CPUHIPER tablosu oluşturur"""
    cpuhiper_create_query = """
    CREATE TABLE IF NOT EXISTS mainview_mvs_cpuhiper (
        id SERIAL PRIMARY KEY,
        cpreidh TEXT,      
        cpgtype TEXT,      
        cpbprio TEXT,      
        cpilsha TEXT,      
        cpibsypc NUMERIC,  
        cprehids TEXT,    
        cpustats VARCHAR,
        bmctime TIMESTAMP WITH TIME ZONE,
        "time" TIME WITHOUT TIME ZONE
    );
    """
    if execute_query(cpuhiper_create_query):
        print("✅ mainview_mvs_cpuhiper tablosu hazır")
    else:
        print("❌ Tablo oluşturulamadı")

def create_asd_table():
    """Creates the mainview_rmf_asd table (ASD View)"""
    create_query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_asd (
            id SERIAL PRIMARY KEY,
            jobname VARCHAR(50),
            service_class_name VARCHAR(50),
            service_class_index VARCHAR(20),
            current_location VARCHAR(20),
            swap_out_status VARCHAR(5),
            dispatching_priority VARCHAR(5),
            central_frame_count INT,
            expanded_frame_count INT,
            srm_storage_target VARCHAR(20),
            target_working_set INT,
            cross_memory_flag VARCHAR(5),
            page_in_rate REAL,
            expanded_page_in_rate REAL,
            swap_total INT,
            wlm_recommendation VARCHAR(20),
            recommended_wsm_value VARCHAR(20),
            record_timestamp TIMESTAMP
        );
    """
    if execute_query(create_query):
        print("✅ mainview_rmf_asd tablosu başarıyla oluşturuldu/hazır")
    else:
        print("❌ mainview_rmf_asd tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def create_spag_table():
    """Creates the mainview_rmf_spag table (SPAG View)"""
    create_query = """
        CREATE TABLE IF NOT EXISTS mainview_rmf_spag (
            id SERIAL PRIMARY KEY,
            lpa_page_in_rate REAL, 
            csa_page_in_rate REAL, 
            csa_page_out_rate REAL, 
            total_swap_rate REAL, 
            swap_page_in_rate REAL, 
            swap_page_out_rate REAL, 
            vio_non_vio_page_in_rate REAL, 
            vio_non_vio_page_out_rate REAL, 
            vio_paging_rate REAL, 
            pages_to_expanded_rate REAL, 
            pages_to_auxiliary_rate REAL,
            common_area_target_wset INT, 
            available_frames NUMERIC, 
            current_uic INT, 
            current_migration_age INT, 
            available_expanded_frames NUMERIC,
            record_timestamp TIMESTAMP
        );
    """
    if execute_query(create_query):
        print("✅ mainview_rmf_spag tablosu başarıyla oluşturuldu/hazır")
    else:
        print("❌ mainview_rmf_spag tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def create_jespool_table():
    """Creates the mainview_mvs_jespool table (JESPOOL View)"""
    create_query = """
        CREATE TABLE IF NOT EXISTS mainview_mvs_jespool (
            id SERIAL PRIMARY KEY,
            bmctime TIMESTAMP,
            time TIME,
            smf_id VARCHAR(10),
            total_volumes VARCHAR(10),
            spool_util VARCHAR(10),
            total_tracks VARCHAR(15),
            used_tracks VARCHAR(15),
            active_spool_util VARCHAR(10),
            total_active_tracks VARCHAR(15),
            used_active_tracks VARCHAR(15),
            active_volumes VARCHAR(10),
            volume VARCHAR(10),
            status VARCHAR(5),
            volume_util VARCHAR(10),
            volume_tracks VARCHAR(15),
            volume_used VARCHAR(15),
            other_volumes VARCHAR(10)
        );
    """
    if execute_query(create_query):
        print("✅ mainview_mvs_jespool tablosu başarıyla oluşturuldu/hazır")
    else:
        print("❌ mainview_mvs_jespool tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def create_wmsplxz_table():
    """Creates the mainview_mvs_wmsplxz table (WMSPLXZ View)"""
    create_query = """
        CREATE TABLE IF NOT EXISTS mainview_mvs_wmsplxz (
            id SERIAL PRIMARY KEY,
            sysplex_name VARCHAR(50),
            system_name VARCHAR(50),
            wlm_velocity_flag VARCHAR(5),
            performance_index REAL,
            install_datetime TIMESTAMP,
            active_policy VARCHAR(50),
            activate_datetime TIMESTAMP,
            record_timestamp TIMESTAMP
        );
    """
    if execute_query(create_query):
        print("✅ mainview_mvs_wmsplxz tablosu başarıyla oluşturuldu/hazır")
    else:
        print("❌ mainview_mvs_wmsplxz tablosu oluşturulamadı! Veritabanı bağlantısını kontrol edin")

def create_all_tables():
    """Creates all monitoring tables"""
    print("🚀 Creating all monitoring tables...")
    
    # Create JCPU table
    print("📊 Creating JCPU table...")
    ensure_table_schema()
    print("✅ JCPU table created")
    
    # Create zFS table
    print("📊 Creating zFS table...")
    create_zfs_table()
    print("✅ zFS table created")
    
    # Create ARD table
    print("📊 Creating ARD table...")
    create_ard_table()
    print("✅ ARD table created")
    
    # Create PGSPP table
    print("📊 Creating PGSPP table...")
    ensure_pgspp_table_schema()
    print("✅ PGSPP table created")
    
    # Create TRX table
    print("📊 Creating TRX table...")
    trx_create_table()
    print("✅ TRX table created")
    
    # Create ASRM table
    print("📊 Creating ASRM table...")
    asrm_create_table()
    print("✅ ASRM table created")
    
    # Create SRCS table
    print("📊 Creating SRCS table...")
    srcs_create_table()
    print("✅ SRCS table created")
    
    # Create SYSOVER table
    print("📊 Creating SYSOVER table...")
    sysover_create_table()
    print("✅ SYSOVER table created")
    
    # Create CPUHIPER table
    print("📊 Creating CPUHIPER table...")
    cpuhiper_create_table()
    print("✅ CPUHIPER table created")
    
    # Create ASD table
    print("📊 Creating ASD table...")
    create_asd_table()
    print("✅ ASD table created")
    
    # Create SPAG table
    print("📊 Creating SPAG table...")
    create_spag_table()
    print("✅ SPAG table created")
    
    # Create JESPOOL table
    print("📊 Creating JESPOOL table...")
    create_jespool_table()
    print("✅ JESPOOL table created")
    
    # Create WMSPLXZ table
    print("📊 Creating WMSPLXZ table...")
    create_wmsplxz_table()
    print("✅ WMSPLXZ table created")
    
    print("🎉 All tables created successfully!")

def main():
    """Main function to create all tables"""
    print("🚀 MVS Monitoring Tables Creation Service")
    print("📋 This will create the following tables:")
    print("  • mainview_mvs_jcpu - JCPU monitoring data")
    print("  • mainview_zfs_file_systems - zFS file system data")
    print("  • mainview_rmf_ard - ARD performance data")
    print("  • mainview_rmf_pgspp - PGSPP page data set data")
    print("  • mainview_rmf_trx - TRX monitoring data")
    print("  • mainview_rmf_asrm - ASRM monitoring data")
    print("  • mainview_rmf_srcs - SRCS monitoring data")
    print("  • mainview_mvs_sysover - SYSOVER monitoring data")
    print("  • mainview_mvs_cpuhiper - CPUHIPER monitoring data")
    print("  • mainview_rmf_asd - ASD monitoring data")
    print("  • mainview_rmf_spag - SPAG monitoring data")
    print("  • mainview_mvs_jespool - JESPOOL monitoring data")
    print("  • mainview_mvs_wmsplxz - WMSPLXZ monitoring data")
    print("\n💡 Press Ctrl+C to cancel")
    
    try:
        create_all_tables()
    except KeyboardInterrupt:
        print(f"\n⚠️ Table creation cancelled by user")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    main()