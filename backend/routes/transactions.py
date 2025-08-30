from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Literal
from models.transaction import Transaction, TransactionCreate, TransactionUpdate
from database import get_database
from auth import get_current_user_id
import re
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from pymongo import ReturnDocument

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=Transaction)
async def create_transaction(
    transaction_data: TransactionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify that the account exists and belongs to the user
    account = await db.accounts.find_one({"id": transaction_data.account_id, "user_id": user_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found for this user")

    transaction = Transaction.from_create(transaction_data, user_id)
    await db.transactions.insert_one(transaction.dict())
    return transaction

@router.put("/{transaction_id}", response_model=Transaction)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    update_dict = update_data.dict(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")

    # If account is being changed, verify the new account exists
    if "account_id" in update_dict:
        account = await db.accounts.find_one({"id": update_dict["account_id"], "user_id": user_id})
        if not account:
            raise HTTPException(status_code=404, detail="New account not found for this user")

    if "date" in update_dict:
        update_dict["month"] = update_dict["date"][:7]

    update_dict["updated_at"] = datetime.utcnow()

    updated_transaction = await db.transactions.find_one_and_update(
        {"id": transaction_id, "user_id": user_id},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER
    )

    if updated_transaction:
        return Transaction(**updated_transaction)
    raise HTTPException(status_code=404, detail="Transaction not found")

@router.get("/", response_model=List[Transaction])
async def get_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database),
    account_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    search: Optional[str] = None,
    type: Optional[Literal["income", "expense", ""]] = Query(default=None),
    category: Optional[str] = None,
    sort: Optional[Literal["date_desc", "amount_desc", "category_asc"]] = Query(default="date_desc")
):
    try:
        query_filter = {"user_id": user_id}

        # ✨ FIX: Ensure we only fetch transactions that have an account_id.
        # This prevents validation errors for old data that might be missing this field.
        query_filter["account_id"] = {"$exists": True}

        if account_id:
            query_filter["account_id"] = account_id
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