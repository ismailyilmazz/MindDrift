import sqlite3

DB_NAME = "minddrift.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS successful_predictions (
            answers_key TEXT PRIMARY KEY,
            prediction TEXT,
            html_content TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_verified_prediction(answers: list):
    key = "|".join(answers)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT prediction, html_content FROM successful_predictions WHERE answers_key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {"found": True, "prediction": row[0], "html_content": row[1]}
    return {"found": False}

def save_verified_prediction(answers: list, prediction: str, html_content: str):
    """Sadece kullanıcı 'Doğru' butonuna basınca çalışır"""
    key = "|".join(answers)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO successful_predictions (answers_key, prediction, html_content) VALUES (?, ?, ?)",
        (key, prediction, html_content)
    )
    conn.commit()
    conn.close()