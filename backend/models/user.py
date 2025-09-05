from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    email: EmailStr
    hashed_password: str
    verified: Optional[bool] = False
    verification_token: Optional[str] = None
