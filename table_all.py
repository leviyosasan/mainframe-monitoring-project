import logging
import psycopg2
from psycopg2 import sql
import sys

# --- LOGGING SETTINGS ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# --- CONFIGURATION ---
CONFIG = {
    'database': {
        'host': "192.168.60.145",
        'port': 5432,
        'database': "mainview",
        'user': "postgres",
        'password': "12345678"
    }
}

# --- DB CONNECTION FUNCTION ---
def get_db_connection():
    """Establishes a PostgreSQL connection."""
    try:
        conn = psycopg2.connect(**CONFIG['database'])
        return conn
    except Exception as e:
        logging.error(f"❌ Database connection error: {e}")
        return None

# --- TABLE CREATION FUNCTIONS ---

def create_asd_table(conn):
    """Creates the mainview_rmf_asd table (ASD View)."""
    TABLE_NAME = "mainview_rmf_asd"
    logging.info(f"🔄 Checking/creating '{TABLE_NAME}' table...")
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
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
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
        conn.commit()
        logging.info(f"✅ '{TABLE_NAME}' successfully created/verified.")
        return True
    except Exception as e:
        logging.error(f"❌ Error creating '{TABLE_NAME}' table: {e}")
        return False

def create_spag_table(conn):
    """Creates the mainview_rmf_spag table (SPAG View)."""
    TABLE_NAME = "mainview_rmf_spag"
    logging.info(f"🔄 Checking/creating '{TABLE_NAME}' table...")
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    
                    -- Rate Fields (Pages-per-second, Swaps-per-minute)
                    lpa_page_in_rate REAL, csa_page_in_rate REAL, csa_page_out_rate REAL, 
                    total_swap_rate REAL, swap_page_in_rate REAL, swap_page_out_rate REAL, 
                    vio_non_vio_page_in_rate REAL, vio_non_vio_page_out_rate REAL, 
                    vio_paging_rate REAL, pages_to_expanded_rate REAL, pages_to_auxiliary_rate REAL,
                    
                    -- Count/Age Fields (Frames, UIC, Migration Age)
                    common_area_target_wset INT, available_frames NUMERIC, current_uic INT, 
                    current_migration_age INT, available_expanded_frames NUMERIC,
                    
                    record_timestamp TIMESTAMP
                );
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
        conn.commit()
        logging.info(f"✅ '{TABLE_NAME}' successfully created/verified.")
        return True
    except Exception as e:
        logging.error(f"❌ Error creating '{TABLE_NAME}' table: {e}")
        return False

def create_jespool_table(conn):
    """Creates the mainview_mvs_jespool table (JESPOOL View)."""
    TABLE_NAME = "mainview_mvs_jespool"
    logging.info(f"🔄 Checking/creating '{TABLE_NAME}' table...")
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
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
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
        conn.commit()
        logging.info(f"✅ '{TABLE_NAME}' successfully created/verified.")
        return True
    except Exception as e:
        logging.error(f"❌ Error creating '{TABLE_NAME}' table: {e}")
        return False

def create_wmsplxz_table(conn):
    """Creates the mainview_mvs_wmsplxz table (WMSPLXZ View)."""
    TABLE_NAME = "mainview_mvs_wmsplxz"
    logging.info(f"🔄 Checking/creating '{TABLE_NAME}' table...")
    
    try:
        with conn.cursor() as cur:
            create_query = sql.SQL("""
                CREATE TABLE IF NOT EXISTS {table_name} (
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
            """).format(table_name=sql.Identifier(TABLE_NAME))
            cur.execute(create_query)
        conn.commit()
        logging.info(f"✅ '{TABLE_NAME}' successfully created/verified.")
        return True
    except Exception as e:
        logging.error(f"❌ Error creating '{TABLE_NAME}' table: {e}")
        return False

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    logging.info("=========================================")
    logging.info("🚀 Mainview Database Setup Started")
    logging.info("=========================================")
    
    db_conn = get_db_connection()
    if db_conn is None:
        logging.error("Program terminated because it could not connect to the database.")
        sys.exit(1)
        
    all_success = True
    
    # Call all table creation functions sequentially
    if not create_asd_table(db_conn):
        all_success = False

    if not create_spag_table(db_conn):
        all_success = False

    if not create_jespool_table(db_conn):
        all_success = False
        
    if not create_wmsplxz_table(db_conn):
        all_success = False 
        
    db_conn.close()
    
    logging.info("=========================================")
    if all_success:
        logging.info("🎉 ALL FOUR TABLES SUCCESSFULLY CREATED/VERIFIED.")
    else:
        logging.error("❌ ERRORS OCCURRED WHILE CREATING SOME TABLES. Please check the logs.")
    logging.info("=========================================")