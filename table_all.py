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
    'host': '192.168.60.148',
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
        "password": "OZAN1239"
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
def create_xcfmbr_table():
    """Creates XCFMBR table in PostgreSQL"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_xcfmbr (
            
            system_name VARCHAR(50),
            group_name VARCHAR(50),
            member_name VARCHAR(50),
            job_name VARCHAR(50),
            percent_received_group_signals DECIMAL(10,2),
            percent_received_system_signals DECIMAL(10,2),
            percent_received_total_signals DECIMAL(10,2),
            percent_sent_group_signals DECIMAL(10,2),
            percent_sent_system_signals DECIMAL(10,2),
            percent_sent_total_signals DECIMAL(10,2),
            percent_group_signals DECIMAL(10,2),
            percent_system_signals DECIMAL(10,2),
            percent_total_signals DECIMAL(10,2),
            signals_received_by_member BIGINT,
            signals_sent_by_member BIGINT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    if execute_query(create_table_query):
        logger.info("XCFMBR table created successfully")
        return True
    else:
        logger.error("Failed to create XCFMBR table")
        return False

def create_udpconf_table():
    """Creates the mainview_udpconf table for UDP configuration monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_udpconf (
            job_name VARCHAR(50),                    -- CONFJOBN
            stack_name VARCHAR(50),                  -- CONFSTCK
            def_recv_bufsize BIGINT,                 -- UDPDEFRC (bytes)
            def_send_bufsize BIGINT,                 -- UDPDEFSN (bytes)
            check_summing VARCHAR(10),               -- CALUCSUM
            restrict_low_port VARCHAR(10),           -- UDPRLWPR
            udp_queue_limit INTEGER,                 -- UDPQUELM
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_name, stack_name, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_udpconf table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_udpconf table")
        return False       
def create_tcpcons_table():
    """Creates the mainview_network_tcpcons table for TCP Connections monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpcons (
            foreign_ip_address VARCHAR(45),          -- FIPADDSC (IPv4/IPv6)
            remote_port INTEGER,                     -- FPORT
            local_port INTEGER,                      -- LPORT
            application_name VARCHAR(50),            -- JOBN
            type_of_open VARCHAR(10),                -- CONNOPEN (Remote/Local)
            interval_bytes_in BIGINT,                -- BYTEID
            interval_bytes_out BIGINT,               -- BYTEOD
            connection_status VARCHAR(20),           -- STATE
            remote_host_name VARCHAR(255),           -- DNSNAME
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(foreign_ip_address, remote_port, local_port, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_tcpcons table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_tcpcons table")
        return False

def create_tcpconf_table():
    """Creates the mainview_tcpconf table for TCP configuration monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpconf (
            
            job_name VARCHAR(50),                    -- CONFJOBN
            stack_name VARCHAR(50),                  -- CONFSTCK
            def_receive_bufsize BIGINT,              -- TCPDEFRC (bytes)
            def_send_bufsize BIGINT,                 -- TCPDEFSN (bytes)
            def_max_receive_bufsize BIGINT,          -- TCPDFMXR (bytes)
            maximum_queue_depth INTEGER,             -- SOMAXCON
            max_retran_time DECIMAL(10,3),           -- CALMAXRE (seconds)
            min_retran_time DECIMAL(10,3),           -- CALMINRE (seconds)
            roundtrip_gain DECIMAL(10,3),            -- CALROUND
            variance_gain DECIMAL(10,3),             -- CALVARIG
            variance_multiple DECIMAL(10,3),         -- CALVARIM
            default_keepalive INTEGER,               -- TCPDEFKE (minutes)
            delay_ack VARCHAR(10),                   -- TCPDLACK
            restrict_low_port VARCHAR(10),           -- TCPRLWPR
            send_garbage VARCHAR(10),                -- TCPSNDGB
            tcp_timestamp VARCHAR(10),               -- TCPTMSTP
            ttls VARCHAR(10),                        -- TCPTTLS
            finwait2time INTEGER,                    -- TCPFINWT (seconds)
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            UNIQUE(job_name, stack_name, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_tcpconf table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_tcpconf table")
        return False

def create_actcons_table():
    """Creates the mainview_network_actcons table for Active Connections monitoring"""
    create_table_query = """
        CREATE TABLE IF NOT EXISTS mainview_network_actcons (
            foreign_ip_address VARCHAR(45),          -- FIPADDSC (IPv4/IPv6)
            remote_port INTEGER,                     -- FPORT
            local_ip_address VARCHAR(45),            -- LIPADDSC (IPv4/IPv6)
            local_port INTEGER,                      -- LPORT
            application_name VARCHAR(50),            -- JOBN
            type_of_open VARCHAR(10),                -- CONNOPEN (Remote/Local)
            interval_bytes_in BIGINT,                -- BYTEID
            interval_bytes_out BIGINT,               -- BYTEOD
            connection_status VARCHAR(20),           -- STATE
            remote_host_name VARCHAR(255),           -- DNSNAME
            system_name VARCHAR(50),                 -- System identifier
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(foreign_ip_address, remote_port, local_ip_address, local_port, system_name)
        )
    """
    
    if execute_query(create_table_query):
        logger.info("✅ mainview_network_actcons table created/ready")
        return True
    else:
        logger.error("❌ Failed to create mainview_network_actcons table")
        return False

def create_syscpc_table():
    """Creates SYSCPC table if it doesn't exist"""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_syscpc (
            smf_id VARCHAR(50),
            system_name VARCHAR(100),
            hardware_name VARCHAR(100),
            cpu_model VARCHAR(100),
            cpc_capacity DECIMAL(15,2),
            base_cpc_capacity DECIMAL(15,2),
            capacity_on_demand VARCHAR(10),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """
    return execute_query(query)

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

def create_jdelay_table():
    """Creates job delay monitoring table"""
    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS mainview_mvs_jdelay (
        
        jobname VARCHAR(255),
        jes_job_number VARCHAR(50),
        address_space_type VARCHAR(10),
        service_class_name VARCHAR(255),
        job_step_monitored VARCHAR(10),
        total_delay_percentage DECIMAL(5,2),
        main_delay_reason VARCHAR(255),
        cpu_delay_percentage DECIMAL(5,2),
        io_delay_percentage DECIMAL(5,2),
        storage_delay_percentage DECIMAL(5,2),
        enqueue_delay_percentage DECIMAL(5,2),
        srm_delay_percentage DECIMAL(5,2),
        subsystem_delay_percentage DECIMAL(5,2),
        idle_percentage DECIMAL(5,2),
        ecb_other_delay_percentage DECIMAL(5,2),
        job_elapsed_time VARCHAR(50),
        address_space_status VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
    return execute_query(create_table_query)

def create_fixed_table():
    """Creates FRMINFO Fixed table - Organized Structure"""
    # First drop table (if exists)
    drop_table_query = "DROP TABLE IF EXISTS mainview_frminfo_fixed;"
    execute_query(drop_table_query)
    
    create_table_query = """
    CREATE TABLE mainview_frminfo_fixed (
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        system_name VARCHAR(100),
        server_name VARCHAR(100),
        
        -- SQA Frames (Average, Minimum, Maximum)
        sqa_avg FLOAT,
        sqa_min FLOAT,
        sqa_max FLOAT,
        
        -- LPA Frames (Average, Minimum, Maximum)
        lpa_avg FLOAT,
        lpa_min FLOAT,
        lpa_max FLOAT,
        
        -- CSA Frames (Average, Minimum, Maximum)
        csa_avg FLOAT,
        csa_min FLOAT,
        csa_max FLOAT,
        
        -- LSQA Frames (Average, Minimum, Maximum)
        lsqa_avg FLOAT,
        lsqa_min FLOAT,
        lsqa_max FLOAT,
        
        -- Private Frames (Average, Minimum, Maximum)
        private_avg FLOAT,
        private_min FLOAT,
        private_max FLOAT,
        
        -- Fixed <16M (Average, Minimum, Maximum)
        fixed_16m_avg FLOAT,
        fixed_16m_min FLOAT,
        fixed_16m_max FLOAT,
        
        -- Fixed Total (Average, Minimum, Maximum)
        fixed_total_avg FLOAT,
        fixed_total_min FLOAT,
        fixed_total_max FLOAT,
        
        -- Fixed Frames Percentage
        fixed_percentage FLOAT
    );
    """
    
    if execute_query(create_table_query):
        logger.info("FRMINFO Fixed table created (Organized Structure)")
        return True
    else:
        logger.error("FRMINFO Fixed table could not be created")
        return False

def create_high_virtual_table():
    """Creates FRMINFO High Virtual table - Organized Structure"""
    # First drop table (if exists)
    drop_table_query = "DROP TABLE IF EXISTS mainview_frminfo_high_virtual;"
    execute_query(drop_table_query)
    
    create_table_query = """
    CREATE TABLE mainview_frminfo_high_virtual (
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        system_name VARCHAR(100),
        server_name VARCHAR(100),
        
        -- High Virtual Common (Average, Minimum, Maximum)
        hv_common_avg FLOAT,
        hv_common_min FLOAT,
        hv_common_max FLOAT,
        
        -- High Virtual Shared (Average, Minimum, Maximum)
        hv_shared_avg FLOAT,
        hv_shared_min FLOAT,
        hv_shared_max FLOAT
    );
    """
    
    if execute_query(create_table_query):
        logger.info("FRMINFO High Virtual table created (Organized Structure)")
        return True
    else:
        logger.error("FRMINFO High Virtual table could not be created")
        return False

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

def vtamcsa_create_table(): # Creates VTAMCSA table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_network_vtamcsa (
    id SERIAL PRIMARY KEY,
    J_SYSTEM TEXT,
    CSACUR BIGINT,
    CSAMAX BIGINT,
    CSALIM BIGINT,
    CSAUSAGE DOUBLE PRECISION,
    C24CUR BIGINT,
    C24MAX BIGINT,
    VTMCUR BIGINT,
    VTMMAX BIGINT,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);
    """
    execute_query(create_query)
    print("✅ mainview_network_vtamcsa table ready")
 
def stacks_create_table(): # Creates STACKS table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_network_stacks (
    id SERIAL PRIMARY KEY,
    JOBNAM8 VARCHAR,
    STEPNAM8 VARCHAR,
    JTARGET TEXT,
    ASID8 VARCHAR,
    MVSLVLX8 VARCHAR,
    VER_REL VARCHAR,
    STARTC8 TIMESTAMP,
    IPADDRC8 VARCHAR,
    STATUS18 VARCHAR,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);
 
    """
    if execute_query(create_query):
        print("✅ mainview_network_stacks table ready")
    else:
        print("❌ Table could not be created")
 
def stackcpu_create_table(): # Creates STACKCPU table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_network_stackcpu (
    id SERIAL PRIMARY KEY,
    STATSTKS TEXT,
    IPPKTRCD INTEGER,
    IPPKTRTR DOUBLE PRECISION,
    IPOUTRED INTEGER,
    IPOUTRTR DOUBLE PRECISION,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);"""
    execute_query(create_query)
    print("✅ mainview_network_stackcpu table ready")
 
 
def dspcz_create_table(): # Creates ASRM table
    create_query = """
    CREATE TABLE IF NOT EXISTS mainview_cmf_dspcz (
    id SERIAL PRIMARY KEY,
    onam TEXT,
    dspname INTEGER,
    asid TEXT,
    key TEXT,
    typx TEXT,
    scox TEXT,
    refx TEXT,
    prox TEXT,
    csizavg NUMERIC,
    csizsum NUMERIC,
    msizavg NUMERIC,
    msizsum NUMERIC,
    bmctime TIMESTAMP WITH TIME ZONE,
    "time" TIME WITHOUT TIME ZONE
);
 
    """
    if execute_query(create_query):
        print("✅ mainview_cmf_dspcz table ready")
    else:
        print("❌ Table could not be created")
 
 
def frminfo_central_create_table(): # Creates FRMINFO_CENTRAL table
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
        print("✅ mainview_frminfo_central table ready")
    else:
        print("❌ Table could not be created")

def create_table_xcfsys():
    """Creates the XCFSYS table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_xcfsys (
            id SERIAL PRIMARY KEY,
            from_system VARCHAR,
            to_system VARCHAR,
            transport_class VARCHAR,
            total_messages BIGINT,
            percent_messages_big NUMERIC(7, 4),
            percent_messages_fit NUMERIC(7, 4),
            percent_messages_small NUMERIC(7, 4),
            no_paths_count BIGINT,
            no_buffers_count BIGINT,
            percent_messages_degraded NUMERIC(7, 4),
            transport_class_longest_message BIGINT,
            avg_used_message_blocks NUMERIC(7, 4),
            percent_transport_class_buffers_used NUMERIC(7, 4),
            max_message BIGINT,
            percent_system_buffers_used NUMERIC(7, 4),
            max_message_blocks BIGINT,
            path_direction VARCHAR,
            record_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_xcfsys table ready")
    else:
        print("❌ Table could not be created")

def create_table_joverr():
    """Creates the JOVERR table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_joverr (
            id SERIAL PRIMARY KEY,
            asgname VARCHAR,
            asgjid VARCHAR,
            asgcnmc VARCHAR,
            asgasid SMALLINT,
            asgfl1c VARCHAR,
            asrepgmn VARCHAR,
            asgjelt BIGINT,
            asgjznt TIMESTAMP,
            asldlyp NUMERIC(7, 3),
            aslusep NUMERIC(7, 3),
            aslidlp NUMERIC(7, 3),
            aslunkp NUMERIC(7, 3),
            aslcppcu NUMERIC(7, 3),
            aslxcpr NUMERIC(7, 3),
            asldpgr NUMERIC(7, 3),
            aslswpr NUMERIC(7, 3),
            aslavfu BIGINT,
            aslwmrt NUMERIC(10, 3),
            aslcpsc NUMERIC(7, 3),
            asgzaat NUMERIC(12, 3),
            asrdzapts NUMERIC(10, 3),
            asgziitc NUMERIC(12, 3),
            asrdzipd NUMERIC(10, 3),
            asrdzapt NUMERIC(6, 3),
            asrdzipt NUMERIC(6, 3),
            bmc_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_joverr table ready")
    else:
        print("❌ Table could not be created")
    

def create_table_jcsa():
    """Creates the JCSA table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_jcsa (
            id SERIAL PRIMARY KEY,
            jobname VARCHAR,
            jes_id VARCHAR,
            asid INTEGER,
            csa_in_use_percent FLOAT,
            ecsa_in_use_percent FLOAT,
            sqa_in_use_percent FLOAT,
            esqa_in_use_percent FLOAT,
            csa_in_use BIGINT,
            ecsa_in_use BIGINT,
            sqa_in_use BIGINT,
            esqa_in_use BIGINT,
            total_used_common_storage BIGINT,
            total_used_percent FLOAT,
            last_update_time TIMESTAMP,
            bmc_time TIMESTAMP
        );
    """
    if execute_query(query):
        print("✅ mainview_jcsa table ready")
    else:
        print("❌ Table could not be created")
    

def create_table_sysfrmiz():
    """Creates the SYSFRMIZ table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_sysfrmiz (
            id SERIAL PRIMARY KEY,
            spgid VARCHAR NOT NULL,
            spluicav BIGINT,
            spiuonlf BIGINT,
            spifinav BIGINT,
            sprefncp NUMERIC(7, 4),
            spispcav BIGINT,
            spreasrp NUMERIC(7, 4),
            spilpfav BIGINT,
            sprealpp NUMERIC(7, 4),
            spicpfav BIGINT,
            spreavpp NUMERIC(7, 4),
            spiqpcav BIGINT,
            sprelsqp NUMERIC(7, 4),
            spiapfav BIGINT,
            spreprvp NUMERIC(7, 4),
            spiafcav BIGINT,
            spreavlp NUMERIC(7, 4),
            spihvcav BIGINT,
            sprecmnp NUMERIC(7, 4),
            spihvsav BIGINT,
            spreshrp NUMERIC(7, 4),
            bmc_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_sysfrmiz table ready")
    else:
        print("❌ Table could not be created")
    

def create_table_connrspz():
    """Creates the CONNRSPZ table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_network_connrspz (
            id SERIAL PRIMARY KEY,
            foreign_ip_address VARCHAR,
            active_conns INT,
            average_rtt_ms INT,
            max_rtt_ms INT,
            interval_bytes_in_sum BIGINT,
            interval_bytes_out_sum BIGINT,
            stack_name VARCHAR,
            remote_host_name VARCHAR,
            interval_duplicate_acks_sum INT,
            interval_retransmit_count_sum INT,
            total_conns INT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_network_connrspz table ready")
    else:
        print("❌ Table could not be created")
    

def create_table_tcpstor():
    """Creates the TCPSTOR table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_network_tcpstor (
            id SERIAL PRIMARY KEY,
            step_name VARCHAR,
            system_name VARCHAR,
            ecsa_current BIGINT,
            ecsa_max BIGINT,
            ecsa_limit BIGINT,
            ecsa_free BIGINT,
            ecsa_modules BIGINT,
            private_current BIGINT,
            private_max BIGINT,
            private_limit BIGINT,
            private_free BIGINT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_network_tcpstor table ready")
    else:
        print("❌ Table could not be created")
    

def create_table_vtmbuff():
    """Creates the VTMBUFF table."""
    query = """
        CREATE TABLE IF NOT EXISTS mainview_network_vtmbuff (
            id SERIAL PRIMARY KEY,
            system_name VARCHAR,
            iobuf_size INT,
            iobuf_times_expanded INT,
            lpbuf_size INT,
            lpbuf_times_expanded INT,
            lfbuf_size INT,
            lfbuf_times_expanded INT,
            record_timestamp TIMESTAMP DEFAULT NOW()
        );
    """
    if execute_query(query):
        print("✅ mainview_network_vtmbuff table ready")
    else:
        print("❌ Table could not be created")
    



def create_all_tables():
    """Creates all monitoring tables"""
    print("🚀 Creating all monitoring tables...")
    
    # Create JCPU table
    print("📊 Creating JCPU table...")
    ensure_table_schema()
    print("✅ JCPU table created")

    # Create XCFMBR table
    print("📊 Creating XCFMBR table...")
    create_xcfmbr_table()
    print("✅ XCFMBR table created")
    
    # Create UDPCONF table
    print("📊 Creating UDPCONF table...")
    create_udpconf_table()
    print("✅ UDPCONF table created")
    
    # Create TCPCONS table
    print("📊 Creating TCPCONS table...")
    create_tcpcons_table()
    print("✅ TCPCONS table created")
    
    # Create TCPCONF table
    print("📊 Creating TCPCONF table...")
    create_tcpconf_table()
    print("✅ TCPCONF table created")
    
    # Create ACTCONS table
    print("📊 Creating ACTCONS table...")
    create_actcons_table()
    print("✅ ACTCONS table created")
    
    # Create zFS table
    print("📊 Creating zFS table...")
    create_zfs_table()
    print("✅ zFS table created")

    # Create SYSCPC table
    print("📊 Creating SYSCPC table...")
    create_syscpc_table()
    print("✅ SYSCPC table created")
    
    # Create PGSPP table
    print("📊 Creating PGSPP table...")
    ensure_pgspp_table_schema()
    print("✅ PGSPP table created")

    # Create JDELAY table
    print("📊 Creating JDELAY table...")
    create_jdelay_table()
    print("✅ JDELAY table created")

    # Create FIXED table
    print("📊 Creating FIXED table...")
    create_fixed_table()
    print("✅ FIXED table created")
    
    # Create HIGH VIRTUAL table
    print("📊 Creating HIGH VIRTUAL table...")
    create_high_virtual_table()
    print("✅ HIGH VIRTUAL table created")

    # Create CSA MONITORING table
    print("📊 Creating CSA MONITORING table...")
    create_csa_monitoring_table()
    print("✅ CSA MONITORING table created")

    # Create XCFSYS table
    print("📊 Creating XCFSYS table...")
    create_table_xcfsys()
    print("✅ XCFSYS table created")
    
    # Create JOVERR table
    print("📊 Creating JOVERR table...")
    create_table_joverr()
    print("✅ JOVERR table created")
    

    # Create JCSA table
    print("📊 Creating JCSA table...")
    create_table_jcsa()
    print("✅ JCSA table created")
    
    # Create SYSFRMIZ table
    print("📊 Creating SYSFRMIZ table...")
    create_table_sysfrmiz()
    print("✅ SYSFRMIZ table created")
    
    # Create CONNRSPZ table
    print("📊 Creating CONNRSPZ table...")
    create_table_connrspz()
    print("✅ CONNRSPZ table created")
    
    # Create TCPSTOR table
    print("📊 Creating TCPSTOR table...")
    create_table_tcpstor()
    print("✅ TCPSTOR table created")
    
    # Create VTMBUFF table
    print("📊 Creating VTMBUFF table...")
    create_table_vtmbuff()
    print("✅ VTMBUFF table created")

    # Create VTAMCSA table
    print("📊 Creating VTAMCSA table...")
    vtamcsa_create_table()
    print("✅ VTAMCSA table created")
    
    # Create STACKS table
    print("📊 Creating STACKS table...")
    stacks_create_table()
    print("✅ STACKS table created")

    # Create STACKCPU table
    print("📊 Creating STACKCPU table...")
    stackcpu_create_table()
    print("✅ STACKCPU table created")

    # Create DSPCZ table
    print("📊 Creating DSPCZ table...")
    dspcz_create_table()
    print("✅ DSPCZ table created")
    
    # Create FRMINFO_CENTRAL table
    print("📊 Creating FRMINFO_CENTRAL table...")
    frminfo_central_create_table()
    print("✅ FRMINFO_CENTRAL table created")

    # Create ARD table
    print("📊 Creating ARD table...")
    create_ard_table()
    print("✅ ARD table created")
    
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
    print("  • mainview_xcfmbr - XCFMBR monitoring data")
    print("  • mainview_udpconf - UDPCONF monitoring data")
    print("  • mainview_tcpcons - TCPCONS monitoring data")
    print("  • mainview_tcpconf - TCPCONF monitoring data")
    print("  • mainview_actcons - ACTCONS monitoring data")
    print("  • mainview_syscpc - SYSCPC monitoring data")
    print("  • mainview_rmf_pgspp - PGSPP monitoring data")
    print("  • mainview_mvs_jdelay - JDELAY monitoring data")
    print("  • mainview_frminfo_fixed - FIXED monitoring data")
    print("  • mainview_frminfo_high_virtual - HIGH VIRTUAL monitoring data")
    print("  • mainview_csasum - CSA MONITORING monitoring data")
    print("  • mainview_xcfsys - XCFSYS monitoring data")
    print("  • mainview_joverr - JOVERR monitoring data")
    print("  • mainview_jcsa - JCSA monitoring data")
    print("  • mainview_sysfrmiz - SYSFRMIZ monitoring data")
    print("  • mainview_network_connrspz - CONNRSPZ monitoring data")
    print("  • mainview_network_tcpstor - TCPSTOR monitoring data")
    print("  • mainview_network_vtmbuff - VTMBUFF monitoring data")
    


    print("\n💡 Press Ctrl+C to cancel")
    
    try:
        create_all_tables()
    except KeyboardInterrupt:
        print(f"\n⚠️ Table creation cancelled by user")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    main()