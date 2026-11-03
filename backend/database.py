
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL").replace(
    "postgresql://",
    "postgresql+psycopg2://"
)

engine = create_engine(DATABASE_URL)

Base = declarative_base()
