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

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal["income", "expense"]
    category: str
    amount: float
    description: str = ""
    date: str  # Format: YYYY-MM-DD
    month: str  # Format: YYYY-MM
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    def from_create(cls, transaction_create: TransactionCreate):
        month = transaction_create.date[:7]  # Extract YYYY-MM
        return cls(
            type=transaction_create.type,
            category=transaction_create.category,
            amount=transaction_create.amount,
            description=transaction_create.description,
            date=transaction_create.date,
            month=month
        )

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