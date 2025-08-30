import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "budget_planner")

class DBManager:
    """Manages the lifecycle of the MongoDB client and database connection."""
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

db_manager = DBManager()

async def connect_to_database():
    """Initializes the database connection and client."""
    print("Connecting to MongoDB...")
    db_manager.client = AsyncIOMotorClient(MONGO_URL)
    db_manager.db = db_manager.client[DB_NAME]
    print("MongoDB connection successful.")

async def close_database_connection():
    """Closes the database connection."""
    if db_manager.client:
        db_manager.client.close()
        print("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    """Dependency function to get the database instance for a request."""
    if db_manager.db is None:
        raise Exception("Database connection is not available.")
    return db_manager.db