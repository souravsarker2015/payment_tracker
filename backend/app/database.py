from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
load_dotenv()
import os

# Get the database URL from environment variable
database_url = os.environ.get("DATABASE_URL", "sqlite:///./database.db")

# Configure connection pooling to prevent "max clients reached" errors
# Supabase free tier has limited connections (typically 15-20)
# pool_config = {}
# if database_url.startswith("postgresql"):
#     pool_config = {
#         "pool_size": 5,              # Maximum number of permanent connections
#         "max_overflow": 10,          # Maximum number of temporary connections
#         "pool_timeout": 30,          # Seconds to wait for a connection
#         "pool_recycle": 1800,        # Recycle connections after 30 minutes
#         "pool_pre_ping": True,       # Verify connections before using them
#     }

engine = create_engine(database_url, echo=True)


def create_db_and_tables():
    # This remains the same; SQLModel handles the differences!
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# Important: You will need to run create_db_and_tables() 
# on the server (usually in main.py) after deployment 
# to create the tables in the new PostgreSQL database.