from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime
import uuid

# A new base class to hold all common transaction fields
class TransactionBase(BaseModel):
    type: Literal["income", "expense"]
    category: str
    amount: float
    description: str = ""
    date: str
    person: Optional[str] = None
    account_id: str # ✨ ADDED: Every transaction must belong to an account.

class TransactionCreate(TransactionBase):
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v
    
    @validator('category')
    def category_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Category cannot be empty')
        return v.strip()
    
    @validator('date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v

class TransactionUpdate(BaseModel):
    type: Optional[Literal["income", "expense"]] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None
    person: Optional[str] = None
    account_id: Optional[str] = None # ✨ ADDED: Allow changing the account

    # Validators remain the same
    @validator('amount')
    def amount_must_be_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be positive')
        return v

    @validator('category')
    def category_must_not_be_empty(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Category cannot be empty')
        return v.strip() if v else v
    
    @validator('date')
    def validate_date_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError('Date must be in YYYY-MM-DD format')
        return v

class Transaction(TransactionBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    month: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    def from_create(cls, transaction_create: TransactionCreate, user_id: str):
        month = transaction_create.date[:7]
        # ✨ SIMPLIFIED: Pass all fields from the create model directly
        return cls(
            user_id=user_id,
            month=month,
            **transaction_create.dict()
        )

# --- Stats Models ---
class MonthlyStats(BaseModel):
    month: str
    income: float = 0.0
    expense: float = 0.0
    net: float = 0.0

class CategoryStats(BaseModel):
    name: str
    value: float
    count: int

class TrendStats(BaseModel):
    month: str
    total: float

class PersonStats(BaseModel):
    name: str
    total_given: float = 0.0
    total_received: float = 0.0
    net_balance: float = 0.0
    transaction_count: int = 0

# ✨ NEW: Pydantic model for our new granular trend data ✨
class GranularTrendStats(BaseModel):
    date: str # This will be a day (YYYY-MM-DD), week (YYYY-WW), or month (YYYY-MM)
    income: float = 0.0
    expense: float = 0.0
    net: float = 0.0