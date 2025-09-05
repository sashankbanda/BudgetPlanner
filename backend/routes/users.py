from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from database import get_database
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
)
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import uuid
from datetime import datetime
import os
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/users", tags=["users"])

# --- Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class GoogleLoginRequest(BaseModel):
    code: str

# --- Endpoints ---

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
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
    verification_token = str(uuid.uuid4())
    
    user_document = {
        "_id": user.email,
        "email": user.email,
        "hashed_password": hashed_password,
        "verified": False,
        "verification_token": verification_token,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_document)
    
    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    logging.warning(f"--- EMAIL VERIFICATION SIMULATION ---")
    logging.warning(f"Verification link for {user.email}: /verify-email?token={verification_token}")
    logging.warning(f"------------------------------------")
    
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

# ✨ THIS IS THE NEW ENDPOINT THAT WAS MISSING ✨
@router.post("/google-login", response_model=Token)
async def google_login(request: GoogleLoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        id_info = id_token.verify_oauth2_token(
            request.code, 
            google_requests.Request(),
            os.environ.get("GOOGLE_CLIENT_ID")
        )
        email = id_info['email']
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = await db.users.find_one({"_id": email})
    if not user:
        # If user doesn't exist, create a new one
        new_user_doc = {
            "_id": email,
            "email": email,
            "hashed_password": None, # No password for Google users
            "verified": True, # Google accounts are pre-verified
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user_doc)

    # Generate tokens for the user
    access_token = create_access_token(data={"sub": email})
    refresh_token = create_refresh_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

# ... (rest of the endpoints remain the same)
@router.post("/token/refresh", response_model=Token)
async def refresh_access_token(request: RefreshTokenRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # This is a placeholder. A real implementation should validate the refresh token more securely.
        user_id = request.refresh_token # Simplified for this example
        new_access_token = create_access_token(data={"sub": user_id})
        new_refresh_token = create_refresh_token(data={"sub": user_id})
        return {"access_token": new_access_token, "token_type": "bearer", "refresh_token": new_refresh_token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": request.email})
    if not user:
        return {"message": "If an account with this email exists, a password reset link has been sent."}

    if not user.get("verified", False):
        logging.warning(f"--- Resending Verification for Forgot Password ---")
        logging.warning(f"Verification link for {user['email']}: /verify-email?token={user.get('verification_token')}")
        logging.warning(f"--------------------------------------------------")
        return {"message": "This account is not verified. A new verification link has been sent to your email."}

    reset_token = str(uuid.uuid4())
    logging.warning(f"--- PASSWORD RESET SIMULATION ---")
    logging.warning(f"Reset token for {request.email}: {reset_token}")
    logging.warning(f"---------------------------------")
    return {"message": "If an account with this email exists, a password reset link has been sent."}

@router.get("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one_and_update(
        {"verification_token": token, "verified": False},
        {"$set": {"verified": True}, "$unset": {"verification_token": ""}}
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")
    return {"message": "Email verified successfully! You can now log in."}

