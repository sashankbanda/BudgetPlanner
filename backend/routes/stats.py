from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Literal, Optional
from models.transaction import MonthlyStats, CategoryStats, TrendStats, PersonStats, GranularTrendStats
from models.group import GroupSummary # ✨ ADDED
from database import get_database
from datetime import datetime, date, timedelta
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/stats", tags=["statistics"])

# ✨ ADD THIS NEW ENDPOINT AT THE TOP ✨
@router.get("/groups", response_model=List[GroupSummary])
async def get_groups_summary_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None)
):
    """
    Retrieves all groups for a user and calculates their net balance
    based on associated transactions.
    """
    # Step 1: Get all groups for the user
    groups_cursor = db.groups.find({"user_id": user_id}).sort("name", 1)
    groups = await groups_cursor.to_list(length=None)
    group_ids = [g["id"] for g in groups]

    # Step 2: Build the aggregation pipeline for transactions
    match_query = {
        "user_id": user_id,
        "group_id": {"$in": group_ids}
    }
    if account_id:
        match_query["account_id"] = account_id

    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$group_id",
            "income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "expense": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}},
            "count": {"$sum": 1}
        }},
        {"$project": {
            "group_id": "$_id",
            "net_balance": {"$subtract": ["$income", "$expense"]},
            "transaction_count": "$count",
            "_id": 0
        }}
    ]
    
    stats_cursor = db.transactions.aggregate(pipeline)
    stats_by_group_id = {s["group_id"]: s for s in await stats_cursor.to_list(length=None)}

    # Step 3: Combine group info with calculated stats
    summaries = []
    for group in groups:
        stats = stats_by_group_id.get(group["id"], {})
        summaries.append(GroupSummary(
            id=group["id"],
            name=group["name"],
            members=group["members"],
            net_balance=stats.get("net_balance", 0.0),
            transaction_count=stats.get("transaction_count", 0)
        ))
        
    return summaries


# --- REST OF THE FILE REMAINS THE SAME ---

@router.get("/trends_granular", response_model=List[GranularTrendStats])
async def get_granular_trend_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None),
    start_date: date = Query(...),
    end_date: date = Query(...),
    period: Literal["daily", "weekly", "monthly"] = Query("daily")
):
    """
    Get trend data with granular control over the time period and grouping.
    - `start_date` & `end_date`: Filter transactions within this range.
    - `period`: Group data by 'daily', 'weekly', or 'monthly'.
    """
    match_query = {
        "user_id": user_id,
        "date": {
            "$gte": start_date.strftime("%Y-%m-%d"),
            "$lte": end_date.strftime("%Y-%m-%d")
        }
    }
    if account_id:
        match_query["account_id"] = account_id

    # Determine the grouping format based on the period
    group_id = {}
    if period == "daily":
        group_id = {"$dateToString": {"format": "%Y-%m-%d", "date": {"$toDate": "$date"}}}
    elif period == "weekly":
        # Group by the Monday of the week
        group_id = {"$dateToString": {"format": "%Y-%U", "date": {"$toDate": "$date"}}}
    elif period == "monthly":
        group_id = {"$dateToString": {"format": "%Y-%m", "date": {"$toDate": "$date"}}}

    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": group_id,
            "income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "expense": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}
        }},
        {"$project": {
            "date": "$_id",
            "income": "$income",
            "expense": "$expense",
            "net": {"$subtract": ["$income", "$expense"]},
            "_id": 0
        }},
        {"$sort": {"date": 1}}
    ]

    cursor = db.transactions.aggregate(pipeline)
    return [GranularTrendStats(**r) for r in await cursor.to_list(length=None)]

@router.get("/monthly", response_model=List[MonthlyStats])
async def get_monthly_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None)
):
    match_query = {"user_id": user_id}
    if account_id:
        match_query["account_id"] = account_id

    pipeline = [
        {"$match": match_query},
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
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None)
):
    match_query = {"type": type, "user_id": user_id}
    if account_id:
        match_query["account_id"] = account_id
        
    pipeline = [
        {"$match": match_query},
        {"$group": {"_id": "$category", "value": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$project": {"name": "$_id", "value": "$value", "count": "$count", "_id": 0}},
        {"$sort": {"value": -1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [CategoryStats(**r) for r in await cursor.to_list(length=None)]

@router.get("/dashboard")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None)
):
    match_query = {"user_id": user_id}
    if account_id:
        match_query["account_id"] = account_id
        
    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": None, 
            "total_income": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}}, 
            "total_expenses": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}}, 
            "transaction_count": {"$sum": 1}
        }},
        {"$project": {
            "total_income": "$total_income", 
            "total_expenses": "$total_expenses", 
            "balance": {"$subtract": ["$total_income", "$total_expenses"]}, 
            "transaction_count": "$transaction_count", 
            "_id": 0
        }}
    ]
    results = await db.transactions.aggregate(pipeline).to_list(length=1)
    return results[0] if results else {"total_income": 0.0, "total_expenses": 0.0, "balance": 0.0, "transaction_count": 0}

@router.get("/people", response_model=List[PersonStats])
async def get_people_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(None)
):
    match_query = {
        "user_id": user_id,
        "person": {"$ne": None, "$exists": True}
    }
    if account_id:
        match_query["account_id"] = account_id

    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$person",
            "total_received": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "total_given": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}},
            "transaction_count": {"$sum": 1}
        }},
        {"$project": {
            "name": "$_id",
            "total_received": "$total_received",
            "total_given": "$total_given",
            "net_balance": {"$subtract": ["$total_received", "$total_given"]},
            "transaction_count": "$transaction_count",
            "_id": 0
        }},
        {"$sort": {"name": 1}}
    ]
    cursor = db.transactions.aggregate(pipeline)
    return [PersonStats(**r) for r in await cursor.to_list(length=None)]