from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import json
import redis
import secrets
import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
import uvicorn
import jwt
from passlib.context import CryptContext
import hashlib
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import redis.asyncio as redis

# 环境变量配置
from dotenv import load_dotenv
load_dotenv()

# 导入settings
from backend.services.config import settings

# FastAPI 应用初始化
app = FastAPI(
    title="农业科技平台API",
    description="农业科技平台后端API服务",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为特定的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接
@app.on_event("startup")
async def startup_db_client():
    app.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
    app.mongodb = app.mongodb_client[settings.MONGODB_DB_NAME]
    
    # 初始化Redis连接
    redis_url = f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    if settings.REDIS_PASSWORD:
        redis_url = f"redis://:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    app.redis = redis.from_url(redis_url, decode_responses=True)
    
    # 创建索引
    await app.mongodb.users.create_index("email", unique=True)
    await app.mongodb.products.create_index("name")
    
    print("已连接到MongoDB和Redis")

@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()
    await app.redis.close()
    print("MongoDB连接已关闭")

# 密码处理
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 数据模型定义
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(None, alias="_id")
    hashed_password: str
    role: str = "merchant"
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime.datetime: lambda v: v.isoformat()
        }

class User(UserBase):
    id: str
    role: str
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    stock: int = 0
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str = Field(None, alias="_id")
    merchant_id: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime.datetime: lambda v: v.isoformat()
        }

class Policy(BaseModel):
    id: str = Field(None, alias="_id")
    title: str
    content: str
    category: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime.datetime: lambda v: v.isoformat()
        }

class FarmerStory(BaseModel):
    id: str = Field(None, alias="_id")
    farmer_name: str
    title: str
    story: str
    image_url: Optional[str] = None
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime.datetime: lambda v: v.isoformat()
        }

# 工具函数
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user_by_username(username: str):
    user = await app.mongodb.users.find_one({"username": username})
    if user:
        return UserInDB(**user)
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# 身份验证和授权
async def get_current_user_from_header(x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭据",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await app.mongodb.users.find_one({"_id": ObjectId(x_user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserInDB(**user)

# API路由 - 认证
@app.post("/auth/login", response_model=Dict[str, Any])
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
        "user": {
            "id": str(user.id),
            "username": user.username,
            "role": user.role
        }
    }

@app.post("/auth/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    # 检查用户是否已存在
    existing_user = await get_user_by_username(user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["role"] = "merchant"
    user_dict["created_at"] = datetime.datetime.now()
    
    result = await app.mongodb.users.insert_one(user_dict)
    new_user = await app.mongodb.users.find_one({"_id": result.inserted_id})
    
    return {
        "status": "success",
        "user": {
            "id": str(new_user["_id"]),
            "username": new_user["username"],
            "role": new_user["role"]
        }
    }

# API路由 - 产品
@app.get("/products", response_model=List[Product])
async def get_products(
    current_user: User = Depends(get_current_user_from_header),
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {"merchant_id": str(current_user.id)}
    if category:
        query["category"] = category
    
    # 先尝试从缓存获取
    cache_key = f"products:{current_user.id}:{category}:{skip}:{limit}"
    cached_data = await app.redis.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = app.mongodb.products.find(query).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    # 存入缓存
    await app.redis.setex(cache_key, 300, json.dumps(products, default=str))  # 缓存5分钟
    
    return products

@app.get("/products/public", response_model=List[Product])
async def get_public_products(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if category:
        query["category"] = category
    
    # 先尝试从缓存获取
    cache_key = f"public_products:{category}:{skip}:{limit}"
    cached_data = await app.redis.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = app.mongodb.products.find(query).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    # 存入缓存
    await app.redis.setex(cache_key, 300, json.dumps(products, default=str))  # 缓存5分钟
    
    return products

@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    # 先尝试从缓存获取
    cache_key = f"product:{product_id}"
    cached_data = await app.redis.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    product = await app.mongodb.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在"
        )
    
    # 存入缓存
    await app.redis.setex(cache_key, 300, json.dumps(product, default=str))  # 缓存5分钟
    
    return product

@app.post("/products", response_model=Product)
async def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user_from_header)
):
    product_dict = product.dict()
    product_dict["merchant_id"] = str(current_user.id)
    product_dict["created_at"] = datetime.datetime.now()
    product_dict["updated_at"] = datetime.datetime.now()
    
    result = await app.mongodb.products.insert_one(product_dict)
    new_product = await app.mongodb.products.find_one({"_id": result.inserted_id})
    
    # 清除相关缓存
    cache_keys = await app.redis.keys(f"products:{current_user.id}:*")
    cache_keys.extend(await app.redis.keys("public_products:*"))
    if cache_keys:
        await app.redis.delete(*cache_keys)
    
    return new_product

@app.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductCreate,
    current_user: User = Depends(get_current_user_from_header)
):
    # 验证产品归属
    existing_product = await app.mongodb.products.find_one({
        "_id": ObjectId(product_id),
        "merchant_id": str(current_user.id)
    })
    
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在或无权限修改"
        )
    
    # 更新产品
    product_dict = product_update.dict()
    product_dict["updated_at"] = datetime.datetime.now()
    
    await app.mongodb.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_dict}
    )
    
    updated_product = await app.mongodb.products.find_one({"_id": ObjectId(product_id)})
    
    # 清除相关缓存
    cache_keys = await app.redis.keys(f"products:{current_user.id}:*")
    cache_keys.extend(await app.redis.keys("public_products:*"))
    cache_keys.append(f"product:{product_id}")
    if cache_keys:
        await app.redis.delete(*cache_keys)
    
    return updated_product

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user_from_header)
):
    # 验证产品归属
    existing_product = await app.mongodb.products.find_one({
        "_id": ObjectId(product_id),
        "merchant_id": str(current_user.id)
    })
    
    if not existing_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在或无权限删除"
        )
    
    await app.mongodb.products.delete_one({"_id": ObjectId(product_id)})
    
    # 清除相关缓存
    cache_keys = await app.redis.keys(f"products:{current_user.id}:*")
    cache_keys.extend(await app.redis.keys("public_products:*"))
    cache_keys.append(f"product:{product_id}")
    if cache_keys:
        await app.redis.delete(*cache_keys)
    
    return

# API路由 - 政策
@app.get("/policies", response_model=List[Policy])
async def get_policies(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {}
    if category:
        query["category"] = category
    
    # 先尝试从缓存获取
    cache_key = f"policies:{category}:{skip}:{limit}"
    cached_data = await app.redis.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = app.mongodb.policies.find(query).skip(skip).limit(limit)
    policies = await cursor.to_list(length=limit)
    
    # 存入缓存
    await app.redis.setex(cache_key, 3600, json.dumps(policies, default=str))  # 缓存1小时
    
    return policies

@app.get("/policies/{policy_id}", response_model=Policy)
async def get_policy(policy_id: str):
    policy = await app.mongodb.policies.find_one({"_id": ObjectId(policy_id)})
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="政策不存在"
        )
    return policy

# API路由 - 农户故事
@app.get("/farmer-stories", response_model=List[FarmerStory])
async def get_farmer_stories(skip: int = 0, limit: int = 100):
    # 先尝试从缓存获取
    cache_key = f"farmer_stories:{skip}:{limit}"
    cached_data = await app.redis.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = app.mongodb.farmer_stories.find().skip(skip).limit(limit)
    farmer_stories = await cursor.to_list(length=limit)
    
    # 存入缓存
    await app.redis.setex(cache_key, 3600, json.dumps(farmer_stories, default=str))  # 缓存1小时
    
    return farmer_stories

@app.get("/farmer-stories/{story_id}", response_model=FarmerStory)
async def get_farmer_story(story_id: str):
    story = await app.mongodb.farmer_stories.find_one({"_id": ObjectId(story_id)})
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="农户故事不存在"
        )
    return story

# API路由 - 文件上传
@app.post("/upload", response_model=Dict[str, str])
async def upload_file(
    file: UploadFile = File(...),
    type: str = Form(...),
    user_id: str = Form(...)
):
    # 验证文件类型
    allowed_types = ["image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不支持的文件类型，仅支持JPEG、PNG和GIF"
        )
    
    # 验证文件大小
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="文件太大，最大支持5MB"
        )
    
    # 生成文件名
    file_ext = os.path.splitext(file.filename)[1]
    random_filename = f"{secrets.token_hex(8)}{file_ext}"
    
    # 确定存储路径
    upload_dir = os.path.join("uploads", type)
    os.makedirs(upload_dir, exist_ok=True)
    
    # 保存文件
    file_path = os.path.join(upload_dir, random_filename)
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # 返回访问URL
    public_url = f"/static/{type}/{random_filename}"
    
    return {"url": public_url}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.datetime.now().isoformat()}

# 中间件
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """添加请求处理时间头"""
    start_time = datetime.datetime.now()
    response = await call_next(request)
    process_time = (datetime.datetime.now() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    return response

# 异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 