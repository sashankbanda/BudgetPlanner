from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Literal
from models.transaction import Transaction, TransactionCreate
from database import get_database
from auth import get_current_user_id
import re
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=Transaction)
async def create_transaction(
    transaction_data: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        transaction = Transaction.from_create(transaction_data, user_id)
        transaction_dict = transaction.dict()
        await db.transactions.insert_one(transaction_dict)
        return transaction
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=List[Transaction])
async def get_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = Query(default=100, ge=1, le=1000),
    search: Optional[str] = None,
    type: Optional[Literal["income", "expense"]] = None,
    category: Optional[str] = None,
    sort: Optional[Literal["date_desc", "amount_desc", "category_asc"]] = Query(default="date_desc")
):
    try:
        query_filter = {"user_id": user_id}
        if type:
            query_filter["type"] = type
        if category:
            query_filter["category"] = category
        if search:
            regex = re.compile(search, re.IGNORECASE)
            query_filter["$or"] = [
                {"description": {"$regex": regex}},
                {"category": {"$regex": regex}},
                {"person": {"$regex": regex}}
            ]
        
        sort_field, sort_order = "date", -1
        if sort == "amount_desc":
            sort_field = "amount"
        elif sort == "category_asc":
            sort_field = "category"
            sort_order = 1
            
        cursor = db.transactions.find(query_filter).sort(sort_field, sort_order).limit(limit)
        return [Transaction(**t) for t in await cursor.to_list(length=limit)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {e}")

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        result = await db.transactions.delete_one({"id": transaction_id, "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete transaction")

@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        transaction = await db.transactions.find_one({"id": transaction_id, "user_id": user_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return Transaction(**transaction)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transaction")