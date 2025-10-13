import psycopg2
import requests
import time
import json
from datetime import datetime, timedelta
import logging
import pytz
import threading

#TOKEN
logon_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"

cpu_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JCPU/data"



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
ANSI_GREEN = "\x1b[32m"
ANSI_BLUE = "\x1b[34m"
ANSI_YELLOW = "\x1b[33m"
ANSI_RED = "\x1b[31m"
ANSI_WHITE = "\x1b[37m"
ANSI_RESET = "\x1b[0m"
# Token veritabanından alma
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
# Token veritabanına kaydetme
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
# PostgreSQL bağlantı fonksiyonu
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
# Common headers and params
def get_common_headers_and_params():
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
# Token retrieval function - DB ile entegre
def get_token():
    global api_token, token_expiry_time
    # Önce DB'den token almayı dene
    db_token, db_expires_at = get_token_from_db()    
    if db_token and db_expires_at:
        # DB'deki token hala geçerli mi kontrol et
        # datetime.now()'u timezone-aware yap
        now_utc = datetime.now(pytz.UTC)
        if now_utc < db_expires_at:
            api_token = db_token
            token_expiry_time = db_expires_at
            print(f"✅ DB'den geçerli token kullanılıyor")
            return api_token    
    # DB'de geçerli token yoksa yeni token al
    print("🔄 Yeni token alınıyor...")    
    # Header and body for the token request
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
                expires_at = datetime.now() + timedelta(minutes=15)                
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
 #---------------
#MVS CPU SYSOVER URL START
def ensure_table_schema():
    create_table_sql = """
        CREATE TABLE IF NOT EXISTS mainview_mvs_jcpu (
            Jobname VARCHAR(50),
            JES_Job_Number VARCHAR(50),
            Address_Space_Type VARCHAR(10),
            Service_Class_Name VARCHAR(50),
            ASGRNMC VARCHAR(50),
            Job_Step_Being_Monitored VARCHAR(10),
            ALL_CPU_seconds DOUBLE PRECISION,
            Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION,
            Using_CPU_Percentage DOUBLE PRECISION,
            CPU_Delay_Percentage DOUBLE PRECISION,
            Average_Priority DOUBLE PRECISION,
            TCB_Time DOUBLE PRECISION,
            Percentage_SRB_Time DOUBLE PRECISION,
            Interval_Unadj_Remote_Enclave_CPU_use DOUBLE PRECISION,
            Job_Total_CPU_Time DOUBLE PRECISION,
            Other_Address_Space_Enclave_CPU_Time DOUBLE PRECISION,
            zIIP_Total_CPU_Time DOUBLE PRECISION,
            zIIP_Interval_CPU_Time DOUBLE PRECISION,
            Dependent_Enclave_zIIP_Total_Time DOUBLE PRECISION,
            Dependent_Enclave_zIIP_Interval_Time DOUBLE PRECISION,
            Dependent_Enclave_zIIP_On_CP_Total DOUBLE PRECISION,
            Interval_CP_time DOUBLE PRECISION,
            Resource_Group_Name VARCHAR(50),
            Resource_Group_Type VARCHAR(50),
            Recovery_Process_Boost VARCHAR(10),
            Implicit_CPU_Critical_Flag VARCHAR(10),
            time TIMESTAMP,
            bmctime TIME
        )
    """
    execute_query(create_table_sql)
    alter_statements = [
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Jobname VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS JES_Job_Number VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Address_Space_Type VARCHAR(10)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Service_Class_Name VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS ASGRNMC VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Job_Step_Being_Monitored VARCHAR(10)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS ALL_CPU_seconds DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Unadj_CPU_Util_with_All_Enclaves DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Using_CPU_Percentage DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS CPU_Delay_Percentage DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Average_Priority DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS TCB_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Percentage_SRB_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Interval_Unadj_Remote_Enclave_CPU_use DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Job_Total_CPU_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Other_Address_Space_Enclave_CPU_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS zIIP_Total_CPU_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS zIIP_Interval_CPU_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Dependent_Enclave_zIIP_Total_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Dependent_Enclave_zIIP_Interval_Time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Dependent_Enclave_zIIP_On_CP_Total DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Interval_CP_time DOUBLE PRECISION",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Resource_Group_Name VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Resource_Group_Type VARCHAR(50)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Recovery_Process_Boost VARCHAR(10)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS Implicit_CPU_Critical_Flag VARCHAR(10)",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS time TIMESTAMP",
        "ALTER TABLE mainview_mvs_jcpu ADD COLUMN IF NOT EXISTS bmctime TIME"
    ]
    for stmt in alter_statements:
        execute_query(stmt)





def row_display(rows):
    # Zaman bilgisini ilk satırdaki JACT$INT üzerinden türet
    dt_utc = datetime.now(pytz.UTC)
    try:
        if rows:
            first_row = rows[0]
            jact_value = first_row.get("JACT$INT")
            if isinstance(jact_value, list) and jact_value:
                first_values = [list(d.values())[0] for d in jact_value if isinstance(d, dict) and d]
                if first_values:
                    raw_time_str = first_values[0]
                    try:
                        if isinstance(raw_time_str, str) and '/' in raw_time_str:
                            dt_local = datetime.strptime(raw_time_str, '%Y/%m/%d %H:%M:%S.%f')
                            turkey_tz = pytz.timezone('Europe/Istanbul')
                            dt_utc = turkey_tz.localize(dt_local).astimezone(pytz.UTC)
                            
                        elif isinstance(raw_time_str, str) and '+' in raw_time_str:
                            raw_time_str_utc = raw_time_str.replace('+03', '+00')
                            dt_utc = datetime.fromisoformat(raw_time_str_utc.replace('+00', '+00:00'))
                            
                        elif isinstance(raw_time_str, str):
                            dt_local = datetime.strptime(raw_time_str, '%Y-%m-%d %H:%M:%S')
                            turkey_tz = pytz.timezone('Europe/Istanbul')
                            dt_utc = turkey_tz.localize(dt_local).astimezone(pytz.UTC)
                            
                    except Exception:
                        dt_utc = datetime.now(pytz.UTC)
                        
    except Exception:
        dt_utc = datetime.now(pytz.UTC)
        

    for row in rows:
        # Existing fields
        asgname_val = row.get("ASGNAME")
        asgjbid_val = row.get("ASGJBID")
        asgcnmc_val = row.get("ASGCNMC")
        asicpsca_raw = row.get("ASICPSCA")
        asicppau_raw = row.get("ASICPPAU")
        asiucpp_raw = row.get("ASIUCPP")
        
        # New fields
        asreyflc_val = row.get("ASREYFLC")  # Address Space Type
        asgrnmc_val = row.get("ASGRNMC")   # ASGRNMC
        asgjsfly_val = row.get("ASGJSFLY") # Job Step Being Monitored
        asiwcpp_raw = row.get("ASIWCPP")   # CPU Delay Percentage
        asidpav_raw = row.get("ASIDPAV")   # Average Priority
        asitcpc_raw = row.get("ASITCPC")   # TCB Time
        asisrbpc_raw = row.get("ASISRBPC") # Percentage SRB Time
        asiecpuu_raw = row.get("ASIECPUU") # Interval Unadj Remote Enclave CPU use
        asgcput_raw = row.get("ASGCPUT")   # Job Total CPU Time
        asgasst_raw = row.get("ASGASST")   # Other Address Space Enclave CPU Time
        asgziitc_raw = row.get("ASGZIITC") # zIIP Total CPU Time
        asrizip_raw = row.get("ASRIZIPTS") # zIIP Interval CPU Time
        asrezdenc_raw = row.get("ASREZDENC") # Dependent Enclave zIIP Total Time
        asrizdenc_raw = row.get("ASRIZDENC") # Dependent Enclave zIIP Interval Time
        asrezdecp_raw = row.get("ASREZDECP") # Dependent Enclave zIIP_On_CP Total
        asreapplcp_raw = row.get("ASREAPPLCP") # Interval CP time
        asrergrp_val = row.get("ASRERGRP") # Resource Group Name
        asrergty_val = row.get("ASRERGTY") # Resource Group Type
        asreasboosc_val = row.get("ASREASBOOSC") # Recovery Process Boost
        asreaccimp_val = row.get("ASREACCIMP") # Implicit CPU Critical Flag

        # Normalize metric shapes to simple string/float values
        def extract_first_metric(value):
            try:
                if isinstance(value, list) and value:
                    first_entry = value[0]
                    if isinstance(first_entry, dict):
                        v = first_entry.get("0")
                        return v
                return value
            except Exception:
                return value

        # Extract values using the helper function
        asicpsca_val = extract_first_metric(asicpsca_raw)
        asicppau_val = extract_first_metric(asicppau_raw)
        asiucpp_val = extract_first_metric(asiucpp_raw)
        asiwcpp_val = extract_first_metric(asiwcpp_raw)
        asidpav_val = extract_first_metric(asidpav_raw)
        asitcpc_val = extract_first_metric(asitcpc_raw)
        asisrbpc_val = extract_first_metric(asisrbpc_raw)
        asiecpuu_val = extract_first_metric(asiecpuu_raw)
        asgcput_val = extract_first_metric(asgcput_raw)
        asgasst_val = extract_first_metric(asgasst_raw)
        asgziitc_val = extract_first_metric(asgziitc_raw)
        asrizip_val = extract_first_metric(asrizip_raw)
        asrezdenc_val = extract_first_metric(asrezdenc_raw)
        asrizdenc_val = extract_first_metric(asrizdenc_raw)
        asrezdecp_val = extract_first_metric(asrezdecp_raw)
        asreapplcp_val = extract_first_metric(asreapplcp_raw)

        insert_query = """
            INSERT INTO mainview_mvs_jcpu
            (Jobname, JES_Job_Number, Address_Space_Type, Service_Class_Name, ASGRNMC, Job_Step_Being_Monitored,
             ALL_CPU_seconds, Unadj_CPU_Util_with_All_Enclaves, Using_CPU_Percentage, CPU_Delay_Percentage,
             Average_Priority, TCB_Time, Percentage_SRB_Time, Interval_Unadj_Remote_Enclave_CPU_use,
             Job_Total_CPU_Time, Other_Address_Space_Enclave_CPU_Time, zIIP_Total_CPU_Time, zIIP_Interval_CPU_Time,
             Dependent_Enclave_zIIP_Total_Time, Dependent_Enclave_zIIP_Interval_Time, Dependent_Enclave_zIIP_On_CP_Total,
             Interval_CP_time, Resource_Group_Name, Resource_Group_Type, Recovery_Process_Boost,
             Implicit_CPU_Critical_Flag, time, bmctime)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        def to_float_if_possible(v):
            try:
                if v is None:
                    return None
                return float(v)
            except Exception:
                return v

        # bmctime should be written in +03 (Europe/Istanbul)
        try:
            turkey_tz = pytz.timezone('Europe/Istanbul')
            dt_tr = dt_utc.astimezone(turkey_tz)
            bmctime_value = dt_tr.time()
        except Exception:
            bmctime_value = dt_utc.time()

        params = (
            asgname_val,  # Jobname
            asgjbid_val,  # JES_Job_Number
            asreyflc_val,  # Address_Space_Type
            asgcnmc_val,  # Service_Class_Name
            asgrnmc_val,  # ASGRNMC
            asgjsfly_val,  # Job_Step_Being_Monitored
            to_float_if_possible(asicpsca_val),  # ALL_CPU_seconds
            to_float_if_possible(asicppau_val),  # Unadj_CPU_Util_with_All_Enclaves
            to_float_if_possible(asiucpp_val),  # Using_CPU_Percentage
            to_float_if_possible(asiwcpp_val),  # CPU_Delay_Percentage
            to_float_if_possible(asidpav_val),  # Average_Priority
            to_float_if_possible(asitcpc_val),  # TCB_Time
            to_float_if_possible(asisrbpc_val),  # Percentage_SRB_Time
            to_float_if_possible(asiecpuu_val),  # Interval_Unadj_Remote_Enclave_CPU_use
            to_float_if_possible(asgcput_val),  # Job_Total_CPU_Time
            to_float_if_possible(asgasst_val),  # Other_Address_Space_Enclave_CPU_Time
            to_float_if_possible(asgziitc_val),  # zIIP_Total_CPU_Time
            to_float_if_possible(asrizip_val),  # zIIP_Interval_CPU_Time
            to_float_if_possible(asrezdenc_val),  # Dependent_Enclave_zIIP_Total_Time
            to_float_if_possible(asrizdenc_val),  # Dependent_Enclave_zIIP_Interval_Time
            to_float_if_possible(asrezdecp_val),  # Dependent_Enclave_zIIP_On_CP_Total
            to_float_if_possible(asreapplcp_val),  # Interval_CP_time
            asrergrp_val,  # Resource_Group_Name
            asrergty_val,  # Resource_Group_Type
            asreasboosc_val,  # Recovery_Process_Boost
            asreaccimp_val,  # Implicit_CPU_Critical_Flag
            dt_utc,  # time
            bmctime_value  # bmctime
        )
        if execute_query(insert_query, params):
            print("✅ Veri eklendi")
        else:
            print("❌ Veri eklenemedi")

def cpu_jcpu_display():
    headers, params  = get_common_headers_and_params()
    response_cpu = requests.get(cpu_url, params=params, headers=headers, verify=False)    
    # 401 hatası alırsak token yenile
    if response_cpu.status_code == 401:
        print("🔄 401 hatası - Token yenileniyor...")
        global api_token
        api_token = get_token()
        if api_token:
            headers = {'Authorization': f'Bearer {api_token}'}
            response_cpu = requests.get(cpu_url, params=params, headers=headers, verify=False)
        else:
            print("❌ Token yenilenemedi")
            return    
    if response_cpu.status_code == 200:
        data = response_cpu.json()
        rows = data.get("Rows", [])
        # Write full response to JSON for inspection
        try:
            with open("JCPU.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"JCPU.json yazma hatası: {e}")
        if rows:
            # Tabloyu ve kolonları garanti altına al
            ensure_table_schema()
            # DB kayıtları için
            row_display(rows)
            for row in rows:
                jobname = row.get("ASGNAME")
                jes_job_number = row.get("ASGJBID")  # JES Job Number
                address_space_type = row.get("ASREYFLC")  # Address Space Type
                service_class = row.get("ASGCNMC")  # Service Class Name
                asgrnmc = row.get("ASGRNMC")  # ASGRNMC
                job_step_monitored = row.get("ASGJSFLY")  # Job Step Being Monitored
                all_cpu_seconds = row.get("ASICPSCA")  # ALL CPU seconds (w/ Enclaves)
                unadj_cpu_util = row.get("ASICPPAU")   # Unadj CPU Util with All Enclaves
                using_cpu_pct = row.get("ASIUCPP")     # Using CPU Percentage
                cpu_delay_pct = row.get("ASIWCPP")     # CPU Delay Percentage
                avg_priority = row.get("ASIDPAV")      # Average Priority
                tcb_time = row.get("ASITCPC")          # TCB Time
                srb_time = row.get("ASISRBPC")         # Percentage SRB Time
                asid = row.get("ASGASID") or row.get("ASIDPAV")
                if not jobname:
                    jobname = f"UNK_{asid}" if asid else "UNK"
                # Colorization: default active=green; if starting -> yellow; if later we detect terminated flag, use blue
                if isinstance(jobname, str) and jobname.strip().upper() == "STARTING":
                    color = ANSI_YELLOW
                else:
                    color = ANSI_GREEN
                suffix = f" ({jes_job_number})" if jes_job_number else ""
                svc_suffix = f" [{service_class}]" if service_class else ""
                ast_suffix = f" <{address_space_type}>" if address_space_type else ""
                asg_suffix = f" ASG:{asgrnmc}" if asgrnmc else ""
                js_suffix = f" JS:{job_step_monitored}" if job_step_monitored else ""
                # ASICPSCA format observed as list of dicts like [{"0": "292.119873"}]
                cpu_suffix = ""
                try:
                    if isinstance(all_cpu_seconds, list) and all_cpu_seconds:
                        first_entry = all_cpu_seconds[0]
                        if isinstance(first_entry, dict):
                            val = first_entry.get("0")
                            if val is not None:
                                cpu_suffix = f" CPU(s):{val}"
                    elif isinstance(all_cpu_seconds, (int, float, str)):
                        cpu_suffix = f" CPU(s):{all_cpu_seconds}"
                except Exception:
                    pass
                # ASICPPAU % extraction
                util_suffix = ""
                try:
                    if isinstance(unadj_cpu_util, list) and unadj_cpu_util:
                        first_entry = unadj_cpu_util[0]
                        if isinstance(first_entry, dict):
                            val = first_entry.get("0")
                            if val is not None:
                                util_suffix = f" Util%:{float(val):.2f}"
                    elif isinstance(unadj_cpu_util, (int, float, str)):
                        util_suffix = f" Util%:{float(unadj_cpu_util):.2f}"
                except Exception:
                    pass
                
                # Display the job information with new fields
                print(f"{color}{jobname}{suffix}{svc_suffix}{ast_suffix}{asg_suffix}{js_suffix}{cpu_suffix}{util_suffix}{ANSI_RESET}")
                
        else:
            print("No rows found in response")
    else:
        print(f"Response error: {response_cpu.status_code}")    

def main():
    """Ana fonksiyon"""
    print("🚀 JCPU Monitoring Başlatılıyor...")
    
    # Token al
    if not get_token():
        print("❌ Token alınamadı. Program sonlandırılıyor.")
        return        
    
    # CPU verilerini çek ve göster
    cpu_jcpu_display()

# Run
if __name__ == "__main__":
    main()