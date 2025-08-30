from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Literal
from models.transaction import MonthlyStats, CategoryStats, TrendStats
from database import get_database
from datetime import datetime
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/stats", tags=["statistics"])

@router.get("/monthly", response_model=List[MonthlyStats])
async def get_monthly_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$month", "income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}}, "expense": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}}},
        {"$project": {"month": "$_id", "income": "$income", "expense": "$expense", "net": {"$subtract": ["$income", "$expense"]}, "_id": 0}},
        {"$sort": {"month": 1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [MonthlyStats(**r) for r in await cursor.to_list(length=None)]

@router.get("/categories", response_model=List[CategoryStats])
async def get_category_stats(
    type: Literal["income", "expense"],
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    pipeline = [
        {"$match": {"type": type, "user_id": user_id}},
        {"$group": {"_id": "$category", "value": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$project": {"name": "$_id", "value": "$value", "count": "$count", "_id": 0}},
        {"$sort": {"value": -1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [CategoryStats(**r) for r in await cursor.to_list(length=None)]

@router.get("/trends", response_model=List[TrendStats])
async def get_trend_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$month", "income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}}, "expense": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}}},
        {"$project": {"month": "$_id", "total": {"$subtract": ["$income", "$expense"]}, "_id": 0}},
        {"$sort": {"month": 1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [TrendStats(**r) for r in await cursor.to_list(length=None)]

@router.get("/dashboard")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Calculates overall statistics for the main dashboard cards."""
    pipeline = [
        # Step 1: Match all transactions for the current user
        {"$match": {"user_id": user_id}},
        
        # Step 2: Group them to calculate totals
        {"$group": {
            "_id": None, 
            "total_income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}}, 
            "total_expenses": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}, 
            "transaction_count": {"$sum": 1}
        }},
        
        # Step 3: Format the final output
        {"$project": {
            "total_income": "$total_income", 
            "total_expenses": "$total_expenses", 
            "balance": {"$subtract": ["$total_income", "$total_expenses"]}, 
            "transaction_count": "$transaction_count", 
            "_id": 0
        }}
    ]
    results = await db.transactions.aggregate(pipeline).to_list(length=1)
    
    # Return the calculated stats, or default zero values if there are no transactions
    return results[0] if results else {"total_income": 0.0, "total_expenses": 0.0, "balance": 0.0, "transaction_count": 0}

# ✨ ADD THIS NEW ENDPOINT
@router.get("/people", response_model=List[PersonStats])
async def get_people_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Calculates financial summaries for each person a user has transacted with."""
    pipeline = [
        # Match transactions that have a person associated with them
        {"$match": {
            "user_id": user_id,
            "person": {"$ne": None, "$exists": True}
        }},
        # Group by the person's name
        {"$group": {
            "_id": "$person",
            "total_received": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "total_given": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}},
            "transaction_count": {"$sum": 1}
        }},
        # Format the output
        {"$project": {
            "name": "$_id",
            "total_received": "$total_received",
            "total_given": "$total_given",
            "net_balance": {"$subtract": ["$total_received", "$total_given"]},
            "transaction_count": "$transaction_count",
            "_id": 0
        }},
        # Sort by name
        {"$sort": {"name": 1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [PersonStats(**r) for r in await cursor.to_list(length=None)]
