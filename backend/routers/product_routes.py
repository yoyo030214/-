from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from bson import ObjectId
from pydantic import BaseModel, Field

from backend.db.mongodb import MongoDB
from backend.services.auth import get_current_user_from_header
from backend.services.config import settings

# 产品模型
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
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime: lambda v: v.isoformat()
        }

router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[Dict[str, Any]])
async def get_products(
    current_user = Depends(get_current_user_from_header),
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """获取当前用户的产品列表"""
    db = MongoDB.db
    query = {"merchant_id": str(current_user["_id"])}
    
    if category:
        query["category"] = category
    
    # 尝试从缓存获取
    cache_key = f"products:{current_user['_id']}:{category or 'all'}:{skip}:{limit}"
    redis_client = await settings.get_redis()
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    # 处理ID
    for product in products:
        product["_id"] = str(product["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(products), ex=300)  # 缓存5分钟
    
    return products

@router.get("/public", response_model=List[Dict[str, Any]])
async def get_public_products(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """获取公开产品列表，无需认证"""
    db = MongoDB.db
    query = {}
    
    if category:
        query["category"] = category
    
    # 尝试从缓存获取
    cache_key = f"public_products:{category or 'all'}:{skip}:{limit}"
    redis_client = await settings.get_redis()
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = db.products.find(query).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    
    # 处理ID
    for product in products:
        product["_id"] = str(product["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(products), ex=300)  # 缓存5分钟
    
    return products

@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product(product_id: str):
    # 先尝试从缓存获取
    redis_client = await settings.get_redis()
    cache_key = f"product:{product_id}"
    cached_product = await redis_client.get(cache_key)
    
    if cached_product:
        return json.loads(cached_product)
    
    # 从数据库获取
    db = MongoDB.db
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在"
        )
    
    # 处理ID
    product["_id"] = str(product["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(product), ex=3600)  # 缓存1小时
    
    return product

@router.post("", response_model=Dict[str, Any])
async def create_product(
    product: ProductCreate,
    current_user = Depends(get_current_user_from_header)
):
    """创建新产品"""
    db = MongoDB.db
    new_product = product.dict()
    new_product["merchant_id"] = str(current_user["_id"])
    new_product["created_at"] = datetime.now()
    new_product["updated_at"] = datetime.now()
    
    result = await db.products.insert_one(new_product)
    new_product["_id"] = str(result.inserted_id)
    
    # 清除相关缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"products:{current_user['_id']}:{product.category or 'all'}:0:100")
    await redis_client.delete(f"public_products:{product.category or 'all'}:0:100")
    
    return new_product

@router.put("/{product_id}", response_model=Dict[str, Any])
async def update_product(
    product_id: str,
    product_update: ProductCreate,
    current_user = Depends(get_current_user_from_header)
):
    """更新产品"""
    # 验证产品归属
    db = MongoDB.db
    product = await db.products.find_one({
        "_id": ObjectId(product_id),
        "merchant_id": str(current_user["_id"])
    })
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在或无权操作"
        )
    
    # 更新产品信息
    update_data = product_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"product:{product_id}")
    await redis_client.delete(f"products:{current_user['_id']}:{product.get('category', 'all')}:0:100")
    await redis_client.delete(f"products:{current_user['_id']}:{product_update.category or 'all'}:0:100")
    await redis_client.delete(f"public_products:{product.get('category', 'all')}:0:100")
    await redis_client.delete(f"public_products:{product_update.category or 'all'}:0:100")
    
    # 获取更新后的产品
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    updated_product["_id"] = str(updated_product["_id"])
    
    return updated_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user = Depends(get_current_user_from_header)
):
    """删除产品"""
    # 验证产品归属
    db = MongoDB.db
    product = await db.products.find_one({
        "_id": ObjectId(product_id),
        "merchant_id": str(current_user["_id"])
    })
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在或无权操作"
        )
    
    # 删除产品
    await db.products.delete_one({"_id": ObjectId(product_id)})
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"product:{product_id}")
    await redis_client.delete(f"products:{current_user['_id']}:{product.get('category', 'all')}:0:100")
    await redis_client.delete(f"public_products:{product.get('category', 'all')}:0:100") 