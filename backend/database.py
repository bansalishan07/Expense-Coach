import sqlite3
from typing import List, Dict, Any

DB_NAME = "expenses.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT DEFAULT "",
            photo_url TEXT DEFAULT "",
            phone TEXT,
            email TEXT,
            is_phone_verified BOOLEAN DEFAULT 0,
            is_email_verified BOOLEAN DEFAULT 0,
            target_amount REAL DEFAULT 0.0,
            next_month_deduction REAL DEFAULT 0.0
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otps (
            contact TEXT PRIMARY KEY,
            otp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def get_all_expenses() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses ORDER BY date DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_profile() -> Dict[str, Any]:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM profile WHERE id = 1')
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}

def update_profile(name: str, photo_url: str, phone: str, email: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE profile SET name = ?, photo_url = ?, phone = ?, email = ?, is_phone_verified=0, is_email_verified=0 WHERE id = 1', (name, photo_url, phone, email))
    conn.commit()
    conn.close()

def save_otp(contact: str, otp: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('INSERT OR REPLACE INTO otps (contact, otp) VALUES (?, ?)', (contact, otp))
    conn.commit()
    conn.close()

def get_otp(contact: str) -> str:
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT otp FROM otps WHERE contact = ?', (contact,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def clear_otp(contact: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM otps WHERE contact = ?', (contact,))
    conn.commit()
    conn.close()

def mark_verified(contact_type: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    if contact_type == 'phone':
        cursor.execute('UPDATE profile SET is_phone_verified = 1 WHERE id = 1')
    elif contact_type == 'email':
        cursor.execute('UPDATE profile SET is_email_verified = 1 WHERE id = 1')
    conn.commit()
    conn.close()

def update_budget(target_amount: float):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE profile SET target_amount = ? WHERE id = 1', (target_amount,))
    conn.commit()
    conn.close()

def increment_next_month_deduction(amount: float):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE profile SET next_month_deduction = next_month_deduction + ? WHERE id = 1', (amount,))
    conn.commit()
    conn.close()

def set_next_month_deduction(amount: float):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE profile SET next_month_deduction = ? WHERE id = 1', (amount,))
    conn.commit()
    conn.close()

def add_expense(amount: float, category: str, date: str, description: str):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO expenses (amount, category, date, description) VALUES (?, ?, ?, ?)', (amount, category, date, description))
    conn.commit()
    conn.close()

def execute_raw_select_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    import re
    cleaned = query.strip().replace('\n', ' ').replace('\r', ' ')
    cleaned_lower = cleaned.lower()
    
    if not cleaned_lower.startswith("select"):
        raise ValueError("Only SELECT queries are allowed for security reasons.")
        
    forbidden = ["insert", "update", "delete", "drop", "alter", "create", "replace", "truncate", "vacuum", "pragma"]
    for word in forbidden:
        pattern = r'\b' + re.escape(word) + r'\b'
        if re.search(pattern, cleaned_lower):
            raise ValueError(f"Query contains forbidden keyword: '{word}'")
            
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
    finally:
        conn.close()
    return result

