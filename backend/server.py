from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
# ✨ FIX 1: Updated database imports for lifespan management
from database import connect_to_database, close_database_connection, get_database

# Import route modules
from routes.transactions import router as transactions_router
from routes.stats import router as stats_router
from routes.users import router as users_router
from routes.people import router as people_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    logger.info("Budget Planner API starting up...")
    # ✨ FIX 2: Use the new connection function
    await connect_to_database()
    db = get_database()
    try:
        # Updated indexes to include user_id for multi-tenancy
        await db.transactions.create_index([("user_id", 1), ("month", 1), ("type", 1)])
        await db.transactions.create_index([("user_id", 1), ("date", -1)])
        await db.transactions.create_index([("user_id", 1), ("category", 1), ("type", 1)])
        # Index for the new users collection
        await db.users.create_index([("email", 1)], unique=True)
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")
    
    yield  # The application runs here

    # Code to run on shutdown
    logger.info("Shutting down Budget Planner API...")
    # ✨ FIX 3: Use the new disconnection function
    await close_database_connection()

app = FastAPI(lifespan=lifespan)

# --- CORS Configuration Update ---
# Define the list of allowed origins
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://allocash.netlify.app",
    # Added login URL back for safety
    "https://allocash.netlify.app/login" 
]

# Add the updated CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, # Use the specific list
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)
# --- End of CORS Configuration Update ---


api_router = APIRouter(prefix="/api")

# ✨ FIX 4: Changed @api_router.get to @api_router.api_route to allow multiple methods
@api_router.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    db = get_database()
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Include all routers
api_router.include_router(users_router)
api_router.include_router(people_router)
api_router.include_router(transactions_router)
api_router.include_router(stats_router)

app.include_router(api_router)