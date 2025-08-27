from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from database import db
from auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Endpoint to register a new user."""
    existing_user = await db.users.find_one({"_id": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user.password)
    
    user_document = {
        "_id": user.email, # Using email as the unique ID
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    await db.users.insert_one(user_document)
    return {"message": "User created successfully", "email": user.email}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Endpoint to login and get an access token."""
    user = await db.users.find_one({"_id": form_data.username}) # username is the email
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}
