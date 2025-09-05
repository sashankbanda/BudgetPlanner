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
import os # ✨ ADDED
import requests # ✨ ADDED

router = APIRouter(prefix="/users", tags=["users"])

# --- Load Google Credentials ---
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
# This MUST match the one you set in the frontend and Google Console
# REDIRECT_URI = "http://localhost:3000/auth/callback" 
# ✨ THIS IS THE CRITICAL CHANGE ✨
# It now uses your live Netlify URL for the redirect.
REDIRECT_URI = "https://allocash.netlify.app/auth/callback" 

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
    
# ✨ ADDED: Model to receive the code from the frontend
class GoogleAuthCode(BaseModel):
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
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}
    
@router.post("/token/refresh", response_model=Token)
async def refresh_access_token(request: RefreshTokenRequest):
    try:
        # Simplified: In a real app, you'd validate the refresh token more thoroughly
        user_id = request.refresh_token.split("-")[0] # Placeholder logic
        new_access_token = create_access_token(data={"sub": user_id})
        new_refresh_token = create_refresh_token(data={"sub": user_id})
        return {"access_token": new_access_token, "token_type": "bearer", "refresh_token": new_refresh_token}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ✨ ADDED: New endpoint for Google Sign-In
@router.post("/auth/google", response_model=Token)
async def auth_google(auth_code: GoogleAuthCode, db: AsyncIOMotorDatabase = Depends(get_database)):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": auth_code.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI, # Must match the one sent from the frontend
        "grant_type": "authorization_code",
    }
    
    # Exchange code for tokens
    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid token from Google")
    
    token_data = response.json()
    google_access_token = token_data.get("access_token")

    # Get user info from Google
    userinfo_url = "https://www.googleapis.com/oauth2/v1/userinfo"
    headers = {"Authorization": f"Bearer {google_access_token}"}
    userinfo_response = requests.get(userinfo_url, headers=headers)
    user_info = userinfo_response.json()
    
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google")

    # Check if user exists, if not, create them
    user = await db.users.find_one({"_id": email})
    if not user:
        # Create a new user, automatically verified
        new_user_doc = {
            "_id": email,
            "email": email,
            "verified": True, # Google handles verification
            "created_at": datetime.utcnow()
            # No password needed for social logins
        }
        await db.users.insert_one(new_user_doc)
    
    # Generate our app's tokens
    app_access_token = create_access_token(data={"sub": email})
    app_refresh_token = create_refresh_token(data={"sub": email})

    return {"access_token": app_access_token, "token_type": "bearer", "refresh_token": app_refresh_token}


# ... (rest of the file: forgot_password, verify_email remains the same) ...

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": request.email})
    if not user:
        return {"message": "If an account with this email exists, a password reset link has been sent."}

    if not user.get("verified", False):
        logging.warning(f"--- Resending Verification for Forgot Password ---")
        logging.warning(f"Verification link for {user['email']}: /verify-email?token={user['verification_token']}")
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
    return {"message": "Email verified successfully. You can now log in."}
