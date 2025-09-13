from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Literal, Optional
from models.transaction import MonthlyStats, CategoryStats, TrendStats, PersonStats, GranularTrendStats
# REMOVED: from models.group import GroupSummary
from database import get_database
from datetime import datetime, date, timedelta
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/stats", tags=["statistics"])

class DateRange(BaseModel):
    first_transaction_date: Optional[date] = None
    last_transaction_date: Optional[date] = None

@router.get("/date-range", response_model=DateRange)
async def get_transaction_date_range(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """Gets the dates of the first and last transactions for the user."""
    first_date_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"date": 1}},
        {"$limit": 1},
        {"$project": {"_id": 0, "date": "$date"}}
    ]
    last_date_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"date": -1}},
        {"$limit": 1},
        {"$project": {"_id": 0, "date": "$date"}}
    ]
    first_result = await db.transactions.aggregate(first_date_pipeline).to_list(length=1)
    last_result = await db.transactions.aggregate(last_date_pipeline).to_list(length=1)
    first_date = first_result[0]['date'] if first_result else None
    last_date = last_result[0]['date'] if last_result else None
    return DateRange(first_transaction_date=first_date, last_transaction_date=last_date)

# THE /groups ENDPOINT HAS BEEN REMOVED FROM HERE

@router.get("/trends_granular", response_model=List[GranularTrendStats])
async def get_granular_trend_stats(
    # ... (code for this function remains the same)
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
    # ... (code for this function remains the same)
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
    # ... (code for this function remains the same)
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
    # ... (code for this function remains the same)
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
    base_match_query = {"user_id": user_id}
    if account_id:
        base_match_query["account_id"] = account_id

    # Pipeline for direct person-to-person transactions
    direct_pipeline = [
        {"$match": {**base_match_query, "person": {"$ne": None}}},
        {"$group": {
            "_id": "$person",
            "total_received": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "total_given": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}},
            "transaction_count": {"$sum": 1}
        }}
    ]

    # Pipeline for split expenses
    split_pipeline = [
        {"$match": {**base_match_query, "split_with": {"$ne": None, "$not": {"$size": 0}}}},
        {"$project": {
            "amount": "$amount",
            "split_with": "$split_with",
            "num_participants": {"$add": [{"$size": "$split_with"}, 1]}
        }},
        {"$project": {
            "share": {"$divide": ["$amount", "$num_participants"]},
            "split_with": "$split_with"
        }},
        {"$unwind": "$split_with"},
        {"$group": {
            "_id": "$split_with",
            "total_given": {"$sum": "$share"}, # From user's perspective, they "gave" this share to the person
            "transaction_count": {"$sum": 1}
        }}
    ]
    
    direct_results = await db.transactions.aggregate(direct_pipeline).to_list(length=None)
    split_results = await db.transactions.aggregate(split_pipeline).to_list(length=None)

    # Combine results in Python
    combined_stats = {}
    for item in direct_results:
        person = item["_id"]
        if person not in combined_stats:
            combined_stats[person] = {"total_given": 0, "total_received": 0, "transaction_count": 0}
        combined_stats[person]["total_given"] += item.get("total_given", 0)
        combined_stats[person]["total_received"] += item.get("total_received", 0)
        combined_stats[person]["transaction_count"] += item.get("transaction_count", 0)

    for item in split_results:
        person = item["_id"]
        if person not in combined_stats:
            combined_stats[person] = {"total_given": 0, "total_received": 0, "transaction_count": 0}
        # A split expense means the other person owes you money, which is like "giving" them credit.
        # This increases the amount they owe you, effectively a "given" amount in the net balance calculation.
        combined_stats[person]["total_received"] += item.get("total_given", 0) # Note: from the user's POV, this is money to be received
        combined_stats[person]["transaction_count"] += item.get("transaction_count", 0)

    final_list = [
        PersonStats(
            name=name,
            total_given=stats["total_given"],
            total_received=stats["total_received"],
            net_balance=stats["total_received"] - stats["total_given"],
            transaction_count=stats["transaction_count"]
        ) for name, stats in combined_stats.items()
    ]

    return sorted(final_list, key=lambda x: x.name)