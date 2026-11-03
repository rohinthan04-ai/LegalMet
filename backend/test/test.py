
from database import engine

try:
    with engine.connect() as connection:
        print("Neon PostgreSQL connection successful!")

except Exception as e:
    print("Database connection failed:", e)
