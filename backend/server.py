from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from database import db, client

# Import route modules
from routes.transactions import router as transactions_router
from routes.stats import router as stats_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Budget Planner API is running", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.transactions.count_documents({})
        return {
            "status": "healthy",
            "database": "connected",
            "message": "All systems operational"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e)
        }

# Include feature routers
api_router.include_router(transactions_router)
api_router.include_router(stats_router)

# Include the main API router in the app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("Budget Planner API starting up...")
    
    # Create database indexes for better performance
    try:
        await db.transactions.create_index([("month", 1), ("type", 1)])
        await db.transactions.create_index([("date", -1)])
        await db.transactions.create_index([("category", 1), ("type", 1)])
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Could not create indexes: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down Budget Planner API...")
    client.close()