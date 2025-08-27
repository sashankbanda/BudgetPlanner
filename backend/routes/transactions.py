from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.transaction import Transaction, TransactionCreate
from database import db
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    """Create a new transaction"""
    try:
        # Create transaction instance
        transaction = Transaction.from_create(transaction_data)
        
        # Convert to dict for MongoDB
        transaction_dict = transaction.dict()
        
        # Insert into database
        result = await db.transactions.insert_one(transaction_dict)
        
        if result.inserted_id:
            return transaction
        else:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/", response_model=List[Transaction])
async def get_transactions(
    limit: int = Query(default=100, ge=1, le=1000),
    month: Optional[str] = Query(default=None, regex=r'^\d{4}-\d{2}$')
):
    """Get all transactions with optional filtering"""
    try:
        # Build query filter
        query_filter = {}
        if month:
            query_filter["month"] = month
        
        # Execute query
        cursor = db.transactions.find(query_filter).sort("date", -1).limit(limit)
        transactions = await cursor.to_list(length=limit)
        
        # Convert MongoDB documents to Transaction models
        result = []
        for transaction in transactions:
            # Remove MongoDB _id field and convert to Transaction
            transaction.pop('_id', None)
            result.append(Transaction(**transaction))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction by ID"""
    try:
        result = await db.transactions.delete_one({"id": transaction_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return {"message": "Transaction deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete transaction")

@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    """Get a specific transaction by ID"""
    try:
        transaction = await db.transactions.find_one({"id": transaction_id})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Remove MongoDB _id field
        transaction.pop('_id', None)
        return Transaction(**transaction)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch transaction")