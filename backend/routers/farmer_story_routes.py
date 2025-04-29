from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from bson import ObjectId
from pydantic import BaseModel, Field

from backend.db.mongodb import MongoDB
from backend.services.auth import get_current_user_from_header
from backend.services.config import settings

# 农户故事模型
class FarmerStory(BaseModel):
    id: str = Field(None, alias="_id")
    farmer_name: str
    title: str
    story: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        orm_mode = True
        json_encoders = {
            ObjectId: lambda v: str(v),
            datetime: lambda v: v.isoformat()
        }

class FarmerStoryCreate(BaseModel):
    farmer_name: str
    title: str
    story: str
    image_url: Optional[str] = None

router = APIRouter(
    prefix="/farmer-stories",
    tags=["farmer_stories"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=List[Dict[str, Any]])
async def get_farmer_stories(skip: int = 0, limit: int = 100):
    """获取农户故事列表"""
    # 先尝试从缓存获取
    cache_key = f"farmer_stories:{skip}:{limit}"
    redis_client = await settings.get_redis()
    cached_data = await redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 从数据库获取
    db = MongoDB.db
    cursor = db.farmer_stories.find().sort("created_at", -1).skip(skip).limit(limit)
    stories = await cursor.to_list(length=limit)
    
    # 处理ID
    for story in stories:
        story["_id"] = str(story["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(stories), ex=1800)  # 缓存30分钟
    
    return stories

@router.get("/{story_id}", response_model=Dict[str, Any])
async def get_farmer_story(story_id: str):
    """获取农户故事详情"""
    # 先尝试从缓存获取
    redis_client = await settings.get_redis()
    cache_key = f"farmer_story:{story_id}"
    cached_story = await redis_client.get(cache_key)
    
    if cached_story:
        return json.loads(cached_story)
    
    # 从数据库获取
    db = MongoDB.db
    story = await db.farmer_stories.find_one({"_id": ObjectId(story_id)})
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="农户故事不存在"
        )
    
    # 处理ID
    story["_id"] = str(story["_id"])
    
    # 缓存结果
    await redis_client.set(cache_key, json.dumps(story), ex=3600)  # 缓存1小时
    
    return story

@router.post("", response_model=Dict[str, Any])
async def create_farmer_story(
    story: FarmerStoryCreate,
    current_user = Depends(get_current_user_from_header)
):
    """创建新农户故事（需要管理员或编辑权限）"""
    # 检查权限
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员或编辑权限"
        )
    
    db = MongoDB.db
    new_story = story.dict()
    new_story["created_at"] = datetime.now()
    new_story["created_by"] = str(current_user["_id"])
    
    result = await db.farmer_stories.insert_one(new_story)
    new_story["_id"] = str(result.inserted_id)
    
    # 清除相关缓存
    redis_client = await settings.get_redis()
    await redis_client.delete("farmer_stories:0:100")
    
    return new_story

@router.put("/{story_id}", response_model=Dict[str, Any])
async def update_farmer_story(
    story_id: str,
    story_update: FarmerStoryCreate,
    current_user = Depends(get_current_user_from_header)
):
    """更新农户故事（需要管理员或编辑权限）"""
    # 检查权限
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员或编辑权限"
        )
    
    db = MongoDB.db
    story = await db.farmer_stories.find_one({"_id": ObjectId(story_id)})
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="农户故事不存在"
        )
    
    # 更新故事信息
    update_data = story_update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now()
    update_data["updated_by"] = str(current_user["_id"])
    
    await db.farmer_stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$set": update_data}
    )
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"farmer_story:{story_id}")
    await redis_client.delete("farmer_stories:0:100")
    
    # 获取更新后的故事
    updated_story = await db.farmer_stories.find_one({"_id": ObjectId(story_id)})
    updated_story["_id"] = str(updated_story["_id"])
    
    return updated_story

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farmer_story(
    story_id: str,
    current_user = Depends(get_current_user_from_header)
):
    """删除农户故事（需要管理员权限）"""
    # 检查权限
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    
    db = MongoDB.db
    story = await db.farmer_stories.find_one({"_id": ObjectId(story_id)})
    
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="农户故事不存在"
        )
    
    # 删除故事
    await db.farmer_stories.delete_one({"_id": ObjectId(story_id)})
    
    # 清除缓存
    redis_client = await settings.get_redis()
    await redis_client.delete(f"farmer_story:{story_id}")
    await redis_client.delete("farmer_stories:0:100") 