from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from database import connect_to_database, close_database_connection, get_database

# Import route modules
from routes.transactions import router as transactions_router
from routes.stats import router as stats_router
from routes.users import router as users_router
from routes.people import router as people_router
from routes.accounts import router as accounts_router
# REMOVED: from routes.groups import router as groups_router

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
    await connect_to_database()
    db = get_database()
    try:
        # Indexes for transactions
        await db.transactions.create_index([("user_id", 1), ("account_id", 1)])
        await db.transactions.create_index([("user_id", 1), ("date", -1)])
        # REMOVED: group_id index
        
        # Index for users
        await db.users.create_index([("email", 1)], unique=True)

        # Index for accounts
        await db.accounts.create_index([("user_id", 1)])
        
        # REMOVED: Index for groups

        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")
    
    yield  # The application runs here

    # Code to run on shutdown
    logger.info("Shutting down Budget Planner API...")
    await close_database_connection()

app = FastAPI(lifespan=lifespan)

# --- CORS Configuration Update ---
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://allocash.netlify.app",
    "https://allocash.netlify.app/login"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End of CORS Configuration Update ---

api_router = APIRouter(prefix="/api")

@api_router.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    db = get_database()
    try:
        await db.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Include all routers
api_router.include_router(accounts_router)
api_router.include_router(users_router)
api_router.include_router(people_router)
# REMOVED: api_router.include_router(groups_router)
api_router.include_router(transactions_router)
api_router.include_router(stats_router)

app.include_router(api_router)