from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from database import get_database
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user_id, # Ensure this is imported
)
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging
import uuid
import secrets
from datetime import datetime, timedelta
import os
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import jwt, JWTError

from fastapi_mail import FastMail, MessageSchema, MessageType
from email_service import conf

router = APIRouter(prefix="/users", tags=["users"])

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

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    id_token: str

# ⚠️ ADD THIS NEW CLASS
class ResendVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, background_tasks: BackgroundTasks, db: AsyncIOMotorDatabase = Depends(get_database)):
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
    
    # Use your frontend's URL. It's best to set this in your .env file.
    frontend_url = os.environ.get("FRONTEND_URL", "https://allocash.netlify.app")
    verification_url = f"{frontend_url}/verify-email?token={verification_token}"

    message = MessageSchema(
        subject="Verify Your Email for Budget Planner",
        recipients=[user.email],
        template_body={"verification_url": verification_url},
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    # ⚠️ FIX: Changed `fm.send_message` to use the correct variable `fm`
    background_tasks.add_task(fm.send_message, message, template_name="verification.html")
    
    return {"message": "Signup successful. Please check your email to verify your account."}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one({"_id": form_data.username})
    if not user or not user.get("hashed_password") or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("verified", False):
          raise HTTPException(
              status_code=status.HTTP_401_UNAUTHORIZED,
              detail="Email not verified. Please check your inbox for a verification link.",
          )

    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/google-login", response_model=Token)
async def google_login(request: GoogleLoginRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        id_info = id_token.verify_oauth2_token(
            request.id_token, 
            google_requests.Request(),
            os.environ.get("GOOGLE_CLIENT_ID")
        )
        email = id_info['email']
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    user = await db.users.find_one({"_id": email})
    
    if not user:
        new_user_doc = {
            "_id": email,
            "email": email,
            "hashed_password": None,
            "verified": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(new_user_doc)
    else:
        if not user.get("verified", False):
            await db.users.update_one(
                {"_id": email},
                {"$set": {"verified": True}}
            )

    access_token = create_access_token(data={"sub": email})
    refresh_token = create_refresh_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@router.post("/token/refresh", response_model=Token)
async def refresh_access_token(request: RefreshTokenRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(request.refresh_token, os.environ.get("SECRET_KEY"), algorithms=["HS256"])
        if payload.get("scope") != "refresh_token":
            raise credentials_exception
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    new_access_token = create_access_token(data={"sub": user_id})
    new_refresh_token = create_refresh_token(data={"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer", "refresh_token": new_refresh_token}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await db.users.find_one({"_id": request.email})
    if user:
        token = secrets.token_urlsafe(32)
        expiry_date = datetime.utcnow() + timedelta(hours=1)
        
        await db.users.update_one(
            {"_id": request.email},
            {"$set": {"reset_password_token": token, "reset_token_expires": expiry_date}}
        )

        reset_url = f"https://allocash.netlify.app/reset-password?token={token}"
        
        message = MessageSchema(
            subject="Your Password Reset Link for Budget Planner",
            recipients=[request.email],
            template_body={"reset_url": reset_url},
            subtype=MessageType.html
        )
        
        fm = FastMail(conf)
        # ⚠️ FIX: Changed `fm.send_message` to use the correct variable `fm`
        background_tasks.add_task(fm.send_message, message, template_name="password_reset.html")

    return {"message": "If an account with this email exists, a password reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )
        
    user = await db.users.find_one({
        "reset_password_token": request.token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")
    
    new_hashed_password = get_password_hash(request.new_password)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": new_hashed_password},
            "$unset": {"reset_password_token": "", "reset_token_expires": ""}
        }
    )
    
    return {"message": "Password has been reset successfully. You can now log in."}


@router.get("/verify-email", status_code=status.HTTP_200_OK)
async def verify_email(token: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    user = await db.users.find_one_and_update(
        {"verification_token": token},
        {"$set": {"verified": True}, "$unset": {"verification_token": ""}}
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")
    return {"message": "Email verified successfully. You can now log in."}

# ⚠️ ADD THIS NEW ENDPOINT
@router.post("/resend-verification", status_code=status.HTTP_200_OK)
async def resend_verification_email(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    user = await db.users.find_one({"_id": request.email})

    if user and not user.get("verified", False):
        verification_token = str(uuid.uuid4())
        
        await db.users.update_one(
            {"_id": request.email},
            {"$set": {"verification_token": verification_token}}
        )

        frontend_url = os.environ.get("FRONTEND_URL", "https://allocash.netlify.app")
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"

        message = MessageSchema(
            subject="Verify Your Email for Budget Planner (New Link)",
            recipients=[request.email],
            template_body={"verification_url": verification_url},
            subtype=MessageType.html
        )
        
        fm = FastMail(conf)
        # ⚠️ FIX: Changed `fm.send_message` to use the correct variable `fm`
        background_tasks.add_task(fm.send_message, message, template_name="verification.html")

    return {"message": "If an unverified account with this email exists, a new verification link has been sent."}

# ⚠️ ADD THIS to delete account completely
@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Permanently deletes the current user and all their associated data.
    This action is irreversible.
    """
    # Delete all data associated with the user first
    await db.transactions.delete_many({"user_id": user_id})
    await db.accounts.delete_many({"user_id": user_id})
    # await db.groups.delete_many({"user_id": user_id}) ⚠️ This line has been commented out as groups are no longer a separate collection.
    
    # Finally, delete the user document itself
    result = await db.users.delete_one({"_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": "User account and all data have been permanently deleted."}