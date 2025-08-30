from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.account import Account, AccountCreate, AccountUpdate
from database import get_database, db_manager # ✨ ADDED: Import db_manager
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

router = APIRouter(prefix="/accounts", tags=["accounts"])

@router.post("/", response_model=Account)
async def create_account(
    account_data: AccountCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    account = Account(**account_data.dict(), user_id=user_id)
    await db.accounts.insert_one(account.dict())
    return account

@router.get("/", response_model=List[Account])
async def get_accounts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    cursor = db.accounts.find({"user_id": user_id})
    return [Account(**doc) for doc in await cursor.to_list(length=None)]

@router.put("/{account_id}", response_model=Account)
async def update_account(
    account_id: str,
    account_data: AccountUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    update_data = account_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    updated_account = await db.accounts.find_one_and_update(
        {"id": account_id, "user_id": user_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    if not updated_account:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**updated_account)

@router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # ✨ FIX: Use a transaction to delete the account and all its associated transactions
    # This prevents orphaned data and ensures data integrity.
    try:
        async with await db_manager.client.start_session() as session:
            async with session.in_transaction():
                # Step 1: Delete the account
                account_result = await db.accounts.delete_one(
                    {"id": account_id, "user_id": user_id},
                    session=session
                )

                if account_result.deleted_count == 0:
                    # This will automatically abort the transaction
                    raise HTTPException(status_code=404, detail="Account not found")

                # Step 2: Delete all transactions associated with that account
                await db.transactions.delete_many(
                    {"account_id": account_id, "user_id": user_id},
                    session=session
                )
        return {"message": "Account and all associated transactions deleted successfully"}
    except Exception as e:
        # Log the exception e for debugging if you have a logger setup
        raise HTTPException(status_code=500, detail="An error occurred while deleting the account.")

