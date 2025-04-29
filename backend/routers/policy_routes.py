from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from bson import ObjectId
from pydantic import BaseModel, Field

from backend.db.mongodb import MongoDB
from backend.services.auth import get_current_user_from_header
from backend.services.config import settings

# 政策模型
class Policy(BaseModel):
    id: str = Field(None, alias="_id")
    title: str
    content: str
    category: str
    publish_date: datetime = Field(default_factory=datetime.now)
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime: lambda v: v.isoformat()
        }

class PolicyCreate(BaseModel):
    title: str
    content: str
    category: str
    publish_date: Optional[datetime] = None

router = APIRouter(
    prefix="/policies",
    tags=["policies"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[Dict[str, Any]])
async def get_policies(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """获取政策信息列表"""
    db = MongoDB.db
    query = {}
    
    if category:
        query["category"] = category
    
    # 尝试从缓存获取
    cache_key = f"policies:{category or 'all'}:{skip}:{limit}"
    redis_client = await settings.get_redis()
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    cursor = db.policies.find(query).sort("publish_date", -1).skip(skip).limit(limit)
    policies = await cursor.to_list(length=limit)
    
    # 处理ID
    for policy in policies:
        policy["_id"] = str(policy["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(policies), ex=1800)  # 缓存30分钟
    
    return policies

@router.get("/{policy_id}", response_model=Dict[str, Any])
async def get_policy(policy_id: str):
    """获取政策详情"""
    # 先尝试从缓存获取
    redis_client = await settings.get_redis()
    cache_key = f"policy:{policy_id}"
    cached_policy = await redis_client.get(cache_key)
    
    if cached_policy:
        return json.loads(cached_policy)
    
    # 从数据库获取
    db = MongoDB.db
    policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="政策信息不存在"
        )
    
    # 处理ID
    policy["_id"] = str(policy["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(policy), ex=3600)  # 缓存1小时
    
    return policy

@router.post("", response_model=Dict[str, Any])
async def create_policy(
    policy: PolicyCreate,
    current_user = Depends(get_current_user_from_header)
):
    """创建新政策信息（需要管理员权限）"""
    # 检查权限
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    db = MongoDB.db
    new_policy = policy.dict()
    
    if not new_policy.get("publish_date"):
        new_policy["publish_date"] = datetime.now()
        
    new_policy["created_at"] = datetime.now()
    new_policy["created_by"] = str(current_user["_id"])
    
    result = await db.policies.insert_one(new_policy)
    new_policy["_id"] = str(result.inserted_id)
    
    # 清除相关缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"policies:{policy.category or 'all'}:0:100")
    
    return new_policy

@router.put("/{policy_id}", response_model=Dict[str, Any])
async def update_policy(
    policy_id: str,
    policy_update: PolicyCreate,
    current_user = Depends(get_current_user_from_header)
):
    """更新政策信息（需要管理员权限）"""
    # 检查权限
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    db = MongoDB.db
    policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="政策信息不存在"
        )
    
    # 更新政策信息
    update_data = policy_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    update_data["updated_by"] = str(current_user["_id"])
    
    await db.policies.update_one(
        {"_id": ObjectId(policy_id)},
        {"$set": update_data}
    )
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"policy:{policy_id}")
    await redis_client.delete(f"policies:{policy.get('category', 'all')}:0:100")
    await redis_client.delete(f"policies:{policy_update.category or 'all'}:0:100")
    
    # 获取更新后的政策
    updated_policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
    updated_policy["_id"] = str(updated_policy["_id"])
    
    return updated_policy

@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: str,
    current_user = Depends(get_current_user_from_header)
):
    """删除政策信息（需要管理员权限）"""
    # 检查权限
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    db = MongoDB.db
    policy = await db.policies.find_one({"_id": ObjectId(policy_id)})
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="政策信息不存在"
        )
    
    # 删除政策
    await db.policies.delete_one({"_id": ObjectId(policy_id)})
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"policy:{policy_id}")
    await redis_client.delete(f"policies:{policy.get('category', 'all')}:0:100") 