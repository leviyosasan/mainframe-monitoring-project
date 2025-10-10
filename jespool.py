import requests
import time
import datetime
import logging
import urllib3
import psycopg2
from psycopg2 import sql

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# === CONFIGURATION ===
CONFIG = {
    'api': {
        'address': "192.168.60.20",
        'port': "15565",
        'protocol': "http",
        'system': "MVERESTAPI_VBT1_3940",
        'product': "MVMVS",
        'view': "JESPOOL",
        'username': "VOBA",
        'password': "OZAN1238"
    },
    'database': {
        'host': "192.168.60.145",
        'port': 5432,
        'database': "mainview",
        'user': "postgres",
        'password': "12345678"
    }
}

TABLE_NAME = "mainview_mvs_jespool"


LOGON_URL = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/logon"
jespool_url = "http://192.168.60.20:15565/cra/serviceGateway/services/MVERESTAPI_VBT1_3940/products/MVMVS/views/JESPOOL/data"

# === LOG SETTINGS ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

class JESPoolMonitor:
    def __init__(self):
        self.api_token = None
        self.error_count = 0
        self.max_errors = 5

    def get_current_time(self):
        """Returns the current time without microseconds"""
        return datetime.datetime.now().replace(microsecond=0)

    def get_token(self):
        """Fetches the API token"""
        logging.info("Fetching token...")
        
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            "username": CONFIG['api']['username'],
            "password": CONFIG['api']['password']
        }

        try:
            response = requests.post(LOGON_URL, headers=headers, data=data, verify=False, timeout=10)
            if response.status_code == 200:
                self.api_token = response.json().get("userToken")
                if self.api_token:
                    logging.info("✅ Token successfully obtained")
                    return True
            logging.error(f"❌ Failed to obtain token! HTTP {response.status_code}")
            return False
        except Exception as e:
            logging.error(f"❌ Token error: {e}")
            return False

    def get_db_connection(self):
        """Establishes a PostgreSQL connection"""
        try:
            return psycopg2.connect(**CONFIG['database'])
        except Exception as e:
            logging.error(f"❌ DB connection error: {e}")
            return None

    def process_data(self, api_data):
        """Processes API data"""
        if not api_data or 'Rows' not in api_data:
            logging.warning("⚠️ 'Rows' not found in API data")
            return None

        rows = api_data['Rows']
        if not rows:
            logging.info("ℹ️ No new data found in API response")
            return None

        current_time = self.get_current_time()
        
        bmctime = current_time
        time_only = current_time.time()
        
        logging.info(f"🕐 BMC Time: {bmctime}, Time Only: {time_only}")

        processed_data = []
        for row in rows:
            processed_data.append({
                'utc_time': bmctime,
                'local_time': time_only,
                'smf_id': row.get('SCGID', ''),
                'total_volumes': row.get('SCIJ2VOL', ''),
                'spool_util': row.get('SCIUTI', ''),
                'total_tracks': row.get('SCITKT', ''),
                'used_tracks': row.get('SCITKTU', ''),
                'active_spool_util': row.get('SCIAUTI', ''),
                'total_active_tracks': row.get('SCIATKT', ''),
                'used_active_tracks': row.get('SCIATKTU', ''),
                'active_volumes': row.get('SCIJ2ACT', ''),
                'volume': row.get('SCIVOL1', ''),
                'status': row.get('SCISTS1', ''),
                'volume_util': row.get('SCIUTI1', ''),
                'volume_tracks': row.get('SCITKT1', ''),
                'volume_used': row.get('SCITKTU1', ''),
                'other_volumes': row.get('SCIJ2OTH', '')
            })

        return processed_data

    def save_to_db(self, processed_data):
        """Saves data to the database"""
        if not processed_data:
            return False

        conn = self.get_db_connection()
        if not conn:
            return False

        try:
            with conn.cursor() as cur:
                records_added = 0
                
                for record in processed_data:
                    # Check if the record already exists (minute-based check)
                    cur.execute(sql.SQL("""
                        SELECT id FROM {table_name}
                        WHERE bmctime = %s AND smf_id = %s
                    """).format(table_name=sql.Identifier(TABLE_NAME)), (record['utc_time'], record['smf_id']))
                    
                    if cur.fetchone():
                        continue
                    
                    # Insert new record
                    cur.execute(sql.SQL("""
                        INSERT INTO {table_name}
                        (bmctime, time, smf_id, total_volumes, spool_util, total_tracks,
                         used_tracks, active_spool_util, total_active_tracks, used_active_tracks,
                         active_volumes, volume, status, volume_util, volume_tracks, volume_used, other_volumes)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """).format(table_name=sql.Identifier(TABLE_NAME)), (
                        record['utc_time'],
                        record['local_time'],
                        record['smf_id'],
                        record['total_volumes'],
                        record['spool_util'],
                        record['total_tracks'],
                        record['used_tracks'],
                        record['active_spool_util'],
                        record['total_active_tracks'],
                        record['used_active_tracks'],
                        record['active_volumes'],
                        record['volume'],
                        record['status'],
                        record['volume_util'],
                        record['volume_tracks'],
                        record['volume_used'],
                        record['other_volumes']
                    ))
                    
                    records_added += 1
                    logging.info(f"📝 NEW RECORD: {record['utc_time'].strftime('%H:%M:%S')} - Util:%{record['spool_util']}")

                conn.commit()
                
                if records_added > 0:
                    logging.info(f"✅ {records_added} new record(s) added")
                else:
                    logging.info("ℹ️ No new records found")
                
                return True
                
        except Exception as e:
            logging.error(f"❌ DB write error: {e}")
            return False
        finally:
            conn.close()

    def fetch_data(self):
        """Fetches and processes JESPool data"""
        if not self.api_token and not self.get_token():
            return False

        headers = {'Authorization': f'Bearer {self.api_token}'}

        try:
            logging.info("🌐 Sending API request...")
            response = requests.get(jespool_url, headers=headers, verify=False, timeout=10)
            
            if response.status_code == 200:
                processed_data = self.process_data(response.json())
                return self.save_to_db(processed_data) if processed_data else False
            elif response.status_code == 401:
                logging.warning("🔑 Token expired, refreshing...")
                self.api_token = None
                return self.fetch_data()
            else:
                logging.error(f"❌ API error: HTTP {response.status_code}")
                return False

        except Exception as e:
            logging.error(f"❌ Request error: {e}")
            return False

    def show_recent_records(self):
        """Displays recent records from the database"""
        conn = self.get_db_connection()
        if not conn:
            return

        try:
            with conn.cursor() as cur:
                cur.execute(sql.SQL("""
                    SELECT id,
                           TO_CHAR(bmctime, 'YYYY-MM-DD HH24:MI:SS') as bmc_time,
                           time as time_only,
                           spool_util, used_tracks, total_tracks, active_volumes
                    FROM {table_name}
                    ORDER BY bmctime DESC LIMIT 5
                """).format(table_name=sql.Identifier(TABLE_NAME)))
                
                logging.info("📊 LAST 5 RECORDS:")
                for record in cur.fetchall():
                    logging.info(f"  {record[0]:3} | {record[1]} | Time:{record[2]} | Util:%{record[3]:>5} | Used:{record[4]:>7} | Total:{record[5]:>8} | Active:{record[6]}")
                    
        except Exception as e:
            logging.error(f"❌ Record read error: {e}")
        finally:
            conn.close()

    def run(self):
        """Main execution loop"""
        logging.info("🚀 JESPOOL monitoring started")
        logging.info("💡 NOTE: Timestamp info is taken from system time, not API")
        
        while self.error_count < self.max_errors:
            try:
                logging.info("\n" + "="*40)
                success = self.fetch_data()
                
                if success:
                    self.error_count = 0
                    self.show_recent_records()
                else:
                    self.error_count += 1
                    logging.warning(f"⚠️ Error occurred: {self.error_count}/{self.max_errors}")

                logging.info("⏳ Waiting for 60 seconds...")
                time.sleep(60)
                
            except KeyboardInterrupt:
                logging.info("🛑 Stopped by user")
                break
            except Exception as e:
                logging.error(f"❌ Unexpected error: {e}")
                self.error_count += 1
                time.sleep(30)

        if self.error_count >= self.max_errors:
            logging.error("🔴 Maximum error count reached")

if __name__ == "__main__":
    monitor = JESPoolMonitor()
    monitor.run()