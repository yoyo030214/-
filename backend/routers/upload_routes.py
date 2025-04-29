from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from typing import Dict, List, Optional
import os
import secrets
from datetime import datetime
import shutil
from pathlib import Path

from backend.db.mongodb import MongoDB
from backend.services.auth import get_current_user_from_header
from backend.services.config import settings
from backend.services.logger import get_logger

logger = get_logger("upload")

# 确保上传目录存在
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# 允许的文件类型
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"]
ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

router = APIRouter(
    prefix="/upload",
    tags=["upload"],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=Dict[str, str])
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    current_user = Depends(get_current_user_from_header)
):
    """上传文件"""
    # 验证文件类型
    content_type = file.content_type
    
    if file_type == "image" and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的图片类型: {content_type}, 支持的类型: {ALLOWED_IMAGE_TYPES}"
        )
    
    if file_type == "document" and content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文档类型: {content_type}, 支持的类型: {ALLOWED_DOCUMENT_TYPES}"
        )
    
    # 获取文件扩展名
    file_extension = content_type.split("/")[1]
    if file_extension == "jpeg":
        file_extension = "jpg"
    elif file_extension == "vnd.openxmlformats-officedocument.wordprocessingml.document":
        file_extension = "docx"
    
    # 创建唯一文件名
    unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}.{file_extension}"
    
    # 根据文件类型分配子目录
    sub_dir = "images" if file_type == "image" else "documents"
    file_dir = UPLOAD_DIR / sub_dir
    file_dir.mkdir(exist_ok=True)
    
    # 保存文件
    file_path = file_dir / unique_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"文件上传失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="文件上传失败"
        )
    finally:
        file.file.close()
    
    # 将文件路径存储到数据库
    file_url = f"/uploads/{sub_dir}/{unique_filename}"
    
    db = MongoDB.db
    await db.uploads.insert_one({
        "filename": unique_filename,
        "original_filename": file.filename,
        "content_type": content_type,
        "file_type": file_type,
        "file_path": str(file_path),
        "file_url": file_url,
        "file_size": os.path.getsize(file_path),
        "uploaded_by": str(current_user["_id"]),
        "created_at": datetime.now()
    })
    
    return {
        "status": "success",
        "filename": unique_filename,
        "file_url": file_url
    }

@router.get("/list", response_model=List[Dict])
async def list_files(
    file_type: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(get_current_user_from_header)
):
    """列出用户上传的文件"""
    db = MongoDB.db
    
    query = {"uploaded_by": str(current_user["_id"])}
    if file_type:
        query["file_type"] = file_type
        
    files = await db.uploads.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    # 转换ID为字符串
    for file in files:
        file["_id"] = str(file["_id"])
        
    return files 