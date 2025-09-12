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
    group_id: Optional[str] = None # ✨ ADDED
    account_id: str

    # ✨ ADDED: Validator to ensure a transaction isn't linked to both
    @validator('person', always=True)
    def check_person_or_group(cls, v, values):
        if v is not None and values.get('group_id') is not None:
            raise ValueError('Transaction cannot be linked to both a person and a group.')
        return v

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
    group_id: Optional[str] = None # ✨ ADDED
    account_id: Optional[str] = None

    # ✨ ADDED: Validator to update model
    @validator('person', always=True)
    def check_person_or_group_update(cls, v, values):
        if v is not None and values.get('group_id') is not None:
            raise ValueError('Transaction cannot be linked to both a person and a group.')
        return v
    
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

class SettleUpPayload(BaseModel):
    """Defines the data required to settle a balance with a person."""
    account_id: str

class GranularTrendStats(BaseModel):
    date: str
    income: float = 0.0
    expense: float = 0.0
    net: float = 0.0