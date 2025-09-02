from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import get_database
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.transaction import Transaction, TransactionCreate, SettleUpPayload # ✨ MODIFIED
from datetime import datetime
import math

router = APIRouter(prefix="/people", tags=["people"])

@router.get("/", response_model=List[str])
async def get_people(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a unique, sorted list of all people associated with a user's transactions."""
    people_list = await db.transactions.distinct("person", {"user_id": user_id, "person": {"$ne": None}})
    people_list.sort()
    return people_list

# ✨ ADD THIS NEW ENDPOINT ✨
@router.post("/{name}/settle", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def settle_up_with_person(
    name: str,
    payload: SettleUpPayload,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Settles the balance with a specific person by creating a balancing transaction.
    """
    # 1. Verify the account exists and belongs to the user
    account = await db.accounts.find_one({"id": payload.account_id, "user_id": user_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found for this user")

    # 2. Calculate the current net balance for the person
    pipeline = [
        {"$match": {"user_id": user_id, "person": name}},
        {"$group": {
            "_id": "$person",
            "total_received": {"$sum": {"$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]}},
            "total_given": {"$sum": {"$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]}},
        }},
        {"$project": {
            "net_balance": {"$subtract": ["$total_received", "$total_given"]},
        }}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(length=1)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"No transactions found for person '{name}'")
        
    net_balance = result[0]['net_balance']

    # 3. Check if there is a balance to settle
    if math.isclose(net_balance, 0):
        raise HTTPException(status_code=400, detail="Balance is already settled.")

    # 4. Create the settlement transaction
    settlement_amount = abs(net_balance)
    settlement_type = "income" if net_balance < 0 else "expense" # If you owe them money (negative balance), you create an expense. If they owe you (positive balance), you receive income.

    settlement_data = TransactionCreate(
        type=settlement_type,
        category="Settlement",
        amount=settlement_amount,
        description=f"Settled up with {name}.",
        date=datetime.utcnow().strftime('%Y-%m-%d'),
        account_id=payload.account_id,
        person=name
    )

    # 5. Save the new transaction to the database
    transaction = Transaction.from_create(settlement_data, user_id)
    await db.transactions.insert_one(transaction.dict())
    
    return transaction