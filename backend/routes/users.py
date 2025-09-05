from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from database import get_database
from auth import get_password_hash, verify_password, create_access_token
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

router = APIRouter(prefix="/users", tags=["users"])

# --- Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# --- Endpoints ---

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Basic validation (FastAPI and Pydantic handle most of it)
    if len(user.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    existing_user = await db.users.find_one({"_id": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    hashed_password = get_password_hash(user.password)
    
    user_document = {
        "_id": user.email,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    await db.users.insert_one(user_document)
    return {"message": "User created successfully", "email": user.email}

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await db.users.find_one({"_id": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}


# --- Placeholder Endpoints for Forgot Password ---

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Placeholder for forgot password functionality.
    In a real app, this would generate a secure, single-use token,
    store it with an expiry date, and email a reset link to the user.
    """
    user = await db.users.find_one({"_id": request.email})
    if not user:
        # We don't want to reveal if an email exists or not, so we always return a success message.
        logging.info(f"Password reset requested for non-existent user: {request.email}")
        return {"message": "If an account with this email exists, a password reset link has been sent."}
    
    # In a real application, you would generate and email a token here.
    # For now, we'll just log it to the console for demonstration.
    reset_token = "dummy-reset-token-for-" + request.email
    logging.warning(f"--- PASSWORD RESET SIMULATION ---")
    logging.warning(f"Reset token for {request.email}: {reset_token}")
    logging.warning(f"Reset URL: /reset-password?token={reset_token}")
    logging.warning(f"---------------------------------")
        
    return {"message": "If an account with this email exists, a password reset link has been sent."}
