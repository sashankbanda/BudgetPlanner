# backend/models/group.py

from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class GroupCreate(GroupBase):
    """Payload for creating a new group with a list of member names."""
    members: List[str] = Field(..., min_items=1)

class GroupUpdate(BaseModel):
    """Payload for updating a group's name or members."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    # The members list must be provided in its entirety for updates.
    members: Optional[List[str]] = Field(None, min_items=1)

class Group(GroupBase):
    """The full group model as stored in the database."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    members: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupSummary(BaseModel):
    """A summary model for the group list view, including the net balance."""
    id: str
    name: str
    members: List[str]
    net_balance: float = 0.0
    transaction_count: int = 0