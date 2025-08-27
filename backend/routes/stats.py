from fastapi import APIRouter, HTTPException, Query
from typing import List, Literal
from models.transaction import MonthlyStats, CategoryStats, TrendStats
from database import db
from datetime import datetime, timedelta

router = APIRouter(prefix="/stats", tags=["statistics"])

@router.get("/monthly", response_model=List[MonthlyStats])
async def get_monthly_stats():
    """Get monthly income/expense statistics"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$month",
                    "income": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]
                        }
                    },
                    "expense": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "month": "$_id",
                    "income": "$income",
                    "expense": "$expense", 
                    "net": {"$subtract": ["$income", "$expense"]},
                    "_id": 0
                }
            },
            {
                "$sort": {"month": 1}
            }
        ]
        
        cursor = db.transactions.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        return [MonthlyStats(**result) for result in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate monthly statistics")

@router.get("/categories", response_model=List[CategoryStats])
async def get_category_stats(type: Literal["income", "expense"]):
    """Get category breakdown for income or expenses"""
    try:
        pipeline = [
            {
                "$match": {"type": type}
            },
            {
                "$group": {
                    "_id": "$category",
                    "value": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "name": "$_id",
                    "value": "$value",
                    "count": "$count",
                    "_id": 0
                }
            },
            {
                "$sort": {"value": -1}
            }
        ]
        
        cursor = db.transactions.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        return [CategoryStats(**result) for result in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate category statistics")

@router.get("/trends", response_model=List[TrendStats])
async def get_trend_stats():
    """Get spending trend data (net income - expenses per month)"""
    try:
        pipeline = [
            {
                "$group": {
                    "_id": "$month",
                    "income": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]
                        }
                    },
                    "expense": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]
                        }
                    }
                }
            },
            {
                "$project": {
                    "month": "$_id",
                    "total": {"$subtract": ["$income", "$expense"]},
                    "_id": 0
                }
            },
            {
                "$sort": {"month": 1}
            }
        ]
        
        cursor = db.transactions.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        return [TrendStats(**result) for result in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate trend statistics")

@router.get("/current-month")
async def get_current_month_stats():
    """Get current month statistics for dashboard cards"""
    try:
        current_month = datetime.now().strftime("%Y-%m")
        
        pipeline = [
            {
                "$match": {"month": current_month}
            },
            {
                "$group": {
                    "_id": None,
                    "total_income": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]
                        }
                    },
                    "total_expenses": {
                        "$sum": {
                            "$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]
                        }
                    },
                    "transaction_count": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "total_income": "$total_income",
                    "total_expenses": "$total_expenses",
                    "balance": {"$subtract": ["$total_income", "$total_expenses"]},
                    "transaction_count": "$transaction_count",
                    "_id": 0
                }
            }
        ]
        
        cursor = db.transactions.aggregate(pipeline)
        results = await cursor.to_list(length=1)
        
        if results:
            return results[0]
        else:
            return {
                "total_income": 0.0,
                "total_expenses": 0.0, 
                "balance": 0.0,
                "transaction_count": 0
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate current month statistics")