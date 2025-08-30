from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.account import Account, AccountCreate, AccountUpdate
from database import get_database
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
    # Optional: You might want to decide what happens to transactions linked to this account.
    # For now, we'll just delete the account.
    result = await db.accounts.delete_one({"id": account_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted successfully"}
