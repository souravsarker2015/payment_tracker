from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
load_dotenv()
import os # 👈 Import os to read environment variables

# --- Change Start ---
# 1. Get the URL from the environment variable
# If DATABASE_URL is not set (e.g., for local testing), use SQLite as a fallback.
# For production, DATABASE_URL will be set by Render.
database_url = os.environ.get("DATABASE_URL", "sqlite:///./database.db")

# Remove connect_args={"check_same_thread": False} if using PostgreSQL,
# as it's only needed for SQLite.
engine = create_engine(database_url, echo=True)
# --- Change End ---


def create_db_and_tables():
    # This remains the same; SQLModel handles the differences!
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# Important: You will need to run create_db_and_tables() 
# on the server (usually in main.py) after deployment 
# to create the tables in the new PostgreSQL database.