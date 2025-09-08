# backend/routes/groups.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models.group import Group, GroupCreate, GroupUpdate
from database import get_database
from auth import get_current_user_id
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("/", response_model=Group, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Creates a new group for the current user."""
    # Ensure members are unique and sorted for consistency
    unique_members = sorted(list(set(group_data.members)))
    group = Group(
        **group_data.dict(exclude={"members"}),
        members=unique_members,
        user_id=user_id
    )
    await db.groups.insert_one(group.dict())
    return group

@router.get("/", response_model=List[Group])
async def get_user_groups(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieves all groups for the current user."""
    cursor = db.groups.find({"user_id": user_id}).sort("name", 1)
    return [Group(**doc) for doc in await cursor.to_list(length=None)]

@router.put("/{group_id}", response_model=Group)
async def update_group(
    group_id: str,
    group_data: GroupUpdate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Updates a group's name or members."""
    update_dict = group_data.dict(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update data provided")

    # Ensure member list is unique and sorted if provided
    if "members" in update_dict:
        update_dict["members"] = sorted(list(set(update_dict["members"])))

    updated_group = await db.groups.find_one_and_update(
        {"id": group_id, "user_id": user_id},
        {"$set": update_dict},
        return_document=ReturnDocument.AFTER
    )
    if not updated_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return Group(**updated_group)

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Deletes a group and unlinks its associated transactions."""
    delete_result = await db.groups.delete_one({"id": group_id, "user_id": user_id})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")

    # Unlink transactions from this group instead of deleting them
    await db.transactions.update_many(
        {"group_id": group_id, "user_id": user_id},
        {"$set": {"group_id": None}}
    )
    return