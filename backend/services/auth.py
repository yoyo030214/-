from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from bson import ObjectId

from backend.db.mongodb import MongoDB
from backend.services.config import settings

# 设置模型类
from pydantic import BaseModel

class TokenData(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None

# OAuth2 处理
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str) -> str:
    """对密码进行加密"""
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password.encode(), salt)
    return hashed_pw.decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否匹配"""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT访问令牌"""
    to_encode = data.copy()
    
    # 设置过期时间
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # 使用密钥和算法创建JWT令牌
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """创建JWT刷新令牌"""
    to_encode = data.copy()
    
    # 设置过期时间
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    
    # 使用密钥和算法创建JWT令牌
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt

async def authenticate_user(username: str, password: str):
    """验证用户凭据"""
    db = MongoDB.db
    user = await db.users.find_one({"username": username})
    
    if not user:
        return False
    
    if not verify_password(password, user["hashed_password"]):
        return False
    
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 解码JWT令牌
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        
        if user_id is None or username is None:
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id, username=username, role=payload.get("role"))
        
    except jwt.PyJWTError:
        raise credentials_exception
        
    # 从数据库获取用户
    db = MongoDB.db
    user = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    
    if user is None:
        raise credentials_exception
        
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user

async def get_current_user_from_header(x_user_id: str = Header(None)):
    """从请求头获取当前用户"""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    db = MongoDB.db
    try:
        user = await db.users.find_one({"_id": ObjectId(x_user_id)})
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户ID",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=400, detail="用户已停用")
    
    return user

async def get_current_active_user(current_user = Depends(get_current_user)):
    """获取当前活跃用户"""
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="用户已停用")
    return current_user

def verify_admin(current_user = Depends(get_current_user)):
    """验证用户是否为管理员"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    return current_user 