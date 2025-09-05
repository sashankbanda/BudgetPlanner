from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from database import get_database
from auth import (
    get_password_hash, verify_password, create_access_token,
    create_refresh_token, SECRET_KEY, ALGORITHM
)
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/users", tags=["users"])
logging.basicConfig(level=logging.INFO)

# --- Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# --- Helper ---
def create_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"exp": expire, "sub": email, "scope": "email_verification"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Endpoints ---

@router.post("/signup", response_model=Token)
async def create_user(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    if len(user.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")

    if await db.users.find_one({"_id": user.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    verification_token = create_verification_token(user.email)

    user_document = {
        "_id": user.email,
        "email": user.email,
        "hashed_password": hashed_password,
        "verified": False,
        "verification_token": verification_token,
    }
    await db.users.insert_one(user_document)

    # SIMULATE SENDING EMAIL
    verification_link = f"http://localhost:3000/verify-email?token={verification_token}"
    logging.warning(f"--- EMAIL VERIFICATION SIMULATION for {user.email} ---")
    logging.warning(f"Verification Link: {verification_link}")
    logging.warning("-------------------------------------------------")
    
    # Instantly log the user in by issuing tokens
    access_token = create_access_token(data={"sub": user.email, "verified": False})
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.get("/verify-email")
async def verify_email(token: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "email_verification":
            raise HTTPException(status_code=401, detail="Invalid token scope")
        email = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Verification link has expired.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"_id": email, "verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or already used verification link.")

    await db.users.update_one({"_id": email}, {"$set": {"verified": True}, "$unset": {"verification_token": ""}})
    return {"message": "Email verified successfully. You can now log in."}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    is_verified = user.get("verified", False)
    access_token = create_access_token(data={"sub": user["_id"], "verified": is_verified})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/token/refresh", response_model=Token)
async def refresh_access_token(request: TokenRefreshRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "refresh_token":
            raise HTTPException(status_code=401, detail="Invalid token scope")
        email = payload.get("sub")
        user = await db.users.find_one({"_id": email})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        is_verified = user.get("verified", False)
        new_access_token = create_access_token(data={"sub": email, "verified": is_verified})
        return {"access_token": new_access_token, "refresh_token": request.refresh_token, "token_type": "bearer"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token has expired. Please log in again.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": request.email})
    if not user:
        logging.info(f"Password reset for non-existent user: {request.email}")
        return {"message": "If an account with this email exists, instructions will be sent."}
    
    if not user.get("verified"):
        # Resend verification email instead of password reset
        verification_token = create_verification_token(request.email)
        await db.users.update_one({"_id": request.email}, {"$set": {"verification_token": verification_token}})
        verification_link = f"http://localhost:3000/verify-email?token={verification_token}"
        logging.warning(f"--- RE-SENDING VERIFICATION for {request.email} ---")
        logging.warning(f"Link: {verification_link}")
        logging.warning("--------------------------------------------------")
        return {"message": "This account is not verified. A new verification link has been sent to your email."}
    
    # Generate and send password reset link for verified users
    reset_token = create_verification_token(request.email) # Can reuse the same token logic
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    logging.warning(f"--- PASSWORD RESET SIMULATION for {request.email} ---")
    logging.warning(f"Reset Link: {reset_link}")
    logging.warning("--------------------------------------------------")
    return {"message": "If an account with this email exists, a password reset link has been sent."}

