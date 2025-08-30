from fastapi import APIRouter, Depends
from typing import List
from database import get_database
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/people", tags=["people"])

@router.get("/", response_model=List[str])
async def get_people(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a unique, sorted list of all people associated with a user's transactions."""
    
    # The 'distinct' method is perfect for this. It finds all unique values for a field.
    people_list = await db.transactions.distinct("person", {"user_id": user_id, "person": {"$ne": None}})
    
    # Sort the list alphabetically
    people_list.sort()
    
    return people_list