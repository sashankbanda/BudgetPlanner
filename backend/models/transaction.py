from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime
import uuid

class TransactionCreate(BaseModel):
    type: Literal["income", "expense"]
    category: str
    amount: float
    description: str = ""
    date: str  # Format: YYYY-MM-DD
    person: Optional[str] = None

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

# ✨ ADD THIS NEW MODEL FOR UPDATING TRANSACTIONS
class TransactionUpdate(BaseModel):
    type: Optional[Literal["income", "expense"]] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None
    person: Optional[str] = None

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

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: Literal["income", "expense"]
    category: str
    amount: float
    description: str = ""
    date: str  # Format: YYYY-MM-DD
    month: str  # Format: YYYY-MM
    person: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    def from_create(cls, transaction_create: TransactionCreate, user_id: str):
        month = transaction_create.date[:7]
        return cls(
            user_id=user_id,
            type=transaction_create.type,
            category=transaction_create.category,
            amount=transaction_create.amount,
            description=transaction_create.description,
            date=transaction_create.date,
            month=month,
            person=transaction_create.person
        )

# --- Stats models remain the same ---
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

# ✨ ADD THIS NEW MODEL AT THE END
class PersonStats(BaseModel):
    name: str
    total_given: float = 0.0
    total_received: float = 0.0
    net_balance: float = 0.0
    transaction_count: int = 0