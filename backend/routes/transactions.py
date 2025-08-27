from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from models.transaction import Transaction, TransactionCreate
from database import db
from auth import get_current_user_id

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=Transaction)
async def create_transaction(
    transaction_data: TransactionCreate, 
    user_id: str = Depends(get_current_user_id)
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
    limit: int = Query(default=100, ge=1, le=1000),
    month: Optional[str] = Query(default=None, regex=r'^\d{4}-\d{2}$'),
    user_id: str = Depends(get_current_user_id)
):
    try:
        query_filter = {"user_id": user_id}
        if month:
            query_filter["month"] = month
        
        cursor = db.transactions.find(query_filter).sort("date", -1).limit(limit)
        transactions = await cursor.to_list(length=limit)
        return [Transaction(**t) for t in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id)
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
    user_id: str = Depends(get_current_user_id)
):
    try:
        transaction = await db.transactions.find_one({"id": transaction_id, "user_id": user_id})
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return Transaction(**transaction)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transaction")
