from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime

class AccountBase(BaseModel):
    name: str
    balance: Optional[float] = 0.0

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None

class Account(AccountBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
