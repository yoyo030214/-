from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from pydantic import BaseModel, EmailStr, Field

from backend.db.mongodb import MongoDB
from backend.services.auth import get_current_user_from_header, authenticate_user, hash_password
from backend.services.config import settings
from bson import ObjectId

# 用户模型
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    role: str
    created_at: datetime
    
    class Config:
        orm_mode = True

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/login", response_model=Dict[str, Any])
async def login(username: str = Form(...), password: str = Form(...)):
    user = await authenticate_user(username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "status": "success",
        "message": "登录成功",
        "user": {
            "id": str(user["_id"]),
            "username": user["username"],
            "email": user.get("email"),
            "role": user.get("role", "user")
        }
    }

@router.post("/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    # 检查用户是否已存在
    db = MongoDB.db
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
        )
    
    # 检查邮箱是否已被使用
    if user_data.email:
        existing_email = await db.users.find_one({"email": user_data.email})
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
    
    # 创建新用户
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "role": "user",
        "created_at": datetime.now()
    }
    
    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    
    return {
        "status": "success",
        "message": "注册成功",
        "user": {
            "id": str(result.inserted_id),
            "username": user_data.username,
            "email": user_data.email,
            "role": "user"
        }
    }

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(current_user = Depends(get_current_user_from_header)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user.get("email"),
        "role": current_user.get("role", "user")
    }

@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user(user_id: str):
    db = MongoDB.db
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user.get("email"),
        "role": user.get("role", "user")
    } 