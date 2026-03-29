import sys
import os

# Add project root to Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

from sqlalchemy import text
from app.db.session import engine

# Ye sirf test hai ki DB connect ho rahi hai ya nahi
with engine.connect() as conn:
    print(conn.execute(text("SELECT 1")).scalar())
