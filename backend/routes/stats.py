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

@router.get("/current-month")
async def get_current_month_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    current_month = datetime.now().strftime("%Y-%m")
    pipeline = [
        {"$match": {"month": current_month, "user_id": user_id}},
        {"$group": {"_id": None, "total_income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}}, "total_expenses": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}, "transaction_count": {"$sum": 1}}},
        {"$project": {"total_income": "$total_income", "total_expenses": "$total_expenses", "balance": {"$subtract": ["$total_income", "$total_expenses"]}, "transaction_count": "$transaction_count", "_id": 0}}
    ]
    results = await db.transactions.aggregate(pipeline).to_list(length=1)
    return results[0] if results else {"total_income": 0.0, "total_expenses": 0.0, "balance": 0.0, "transaction_count": 0}