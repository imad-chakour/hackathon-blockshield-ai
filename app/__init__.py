# init_db.py
import sqlite3
import pandas as pd
from urllib.parse import urlparse

def initialize_database():
    # Connect to SQLite database (will be created if it doesn't exist)
    conn = sqlite3.connect('threats.db')
    cursor = conn.cursor()
    
    # Create threats table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS threats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        url_length INTEGER,
        domain TEXT,
        suspicious_flag BOOLEAN,
        is_malicious BOOLEAN,
        threat_signature TEXT,
        threat_level TEXT,
        confidence REAL,
        threat_id TEXT UNIQUE,
        verified BOOLEAN DEFAULT 0,
        blockchain_status TEXT DEFAULT 'not_reported',
        verification_tx_hash TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create indexes for faster queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_type ON threats(type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_domain ON threats(domain)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_threat_id ON threats(threat_id)')
    
    # Load your CSV data
    df = pd.read_csv('./AI/malicious_phish.csv')  # Your original dataset
    
    # Preprocess the data to match your table schema
    df['url_length'] = df['url'].apply(len)
    df['domain'] = df['url'].apply(lambda x: urlparse(x).netloc if pd.notnull(x) else None)
    df['suspicious_flag'] = df['url'].apply(
        lambda x: any(word in x.lower() for word in ['login', 'verify', 'secure', 'account', 'update']))
    
    # Map 'type' to is_malicious (assuming 'benign' is False, others True)
    df['is_malicious'] = df['type'].apply(lambda x: 0 if x == 'benign' else 1)
    
    # Generate threat IDs (similar to your existing code)
    import time
    import hashlib
    
    df['threat_id'] = df.apply(lambda row: 
        f"threat_{int(time.time())}_{hashlib.sha256(row['url'].encode()).hexdigest()[:8]}", 
        axis=1)
    
    # Select and reorder columns to match your table
    db_columns = [
        'url', 'type', 'url_length', 'domain', 'suspicious_flag', 
        'is_malicious', 'threat_id'
    ]
    df_db = df[db_columns]
    
    # Insert data into SQLite
    df_db.to_sql('threats', conn, if_exists='replace', index=False)
    
    print(f"Inserted {len(df_db)} records into the database")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    initialize_database()