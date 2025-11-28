import sqlite3
import os

# Path to DB
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "database", "careerpilot.db")

def update_schema():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(resumes)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "ats_score" not in columns:
            print("Adding ats_score column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN ats_score FLOAT")
            
        if "ats_report" not in columns:
            print("Adding ats_report column...")
            cursor.execute("ALTER TABLE resumes ADD COLUMN ats_report TEXT")
            
        conn.commit()
        print("Schema update completed.")
        
    except Exception as e:
        print(f"Error updating schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
