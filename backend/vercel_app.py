import os
import shutil
import sys

# Ensure the original directory is in sys.path so imports continue to work
original_dir = os.path.dirname(os.path.abspath(__file__))
if original_dir not in sys.path:
    sys.path.insert(0, original_dir)

# Copy the seeded SQLite database to /tmp so it is writable
original_db = os.path.join(original_dir, "expenses.db")
target_db = "/tmp/expenses.db"

if os.path.exists(original_db) and not os.path.exists(target_db):
    try:
        shutil.copy(original_db, target_db)
    except Exception as e:
        print(f"Failed to copy DB: {e}")

# Change working directory to /tmp
os.chdir("/tmp")

# Import the original FastAPI app
from main import app
