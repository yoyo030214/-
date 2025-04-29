from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import json
from datetime import datetime
import secrets
from typing import Dict, Any
import logging

from backend.db.mongodb import MongoDB
from backend.services.config import settings
from backend.services.logger import get_logger
from backend.routers import (
    user_routes,
    product_routes,
    policy_routes,
    farmer_story_routes,
    upload_routes
)

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="农业科技平台后端API服务",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求ID中间件
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = secrets.token_hex(8)
    request.state.request_id = request_id
    
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    # 记录请求信息
    logger = get_logger("api")
    logger.info(
        f"请求处理 - 路径: {request.url.path} - 方法: {request.method} - "
        f"请求ID: {request_id} - 处理时间: {process_time:.4f}秒"
    )
    
    return response

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger = get_logger("api")
    request_id = getattr(request.state, "request_id", "unknown")
    
    logger.error(
        f"请求异常 - 路径: {request.url.path} - 方法: {request.method} - "
        f"请求ID: {request_id} - 异常: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "服务器内部错误",
            "request_id": request_id
        }
    )

# 数据库连接
@app.on_event("startup")
async def startup_db_client():
    # 连接数据库
    await MongoDB.connect_to_mongodb()
    
    # 缓存预热
    try:
        await cache_warmup()
    except Exception as e:
        logger = get_logger("api")
        logger.error(f"缓存预热失败: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await MongoDB.close_mongodb_connection()

# 缓存预热函数
async def cache_warmup():
    """启动时预热缓存"""
    logger = get_logger("cache")
    logger.info("开始预热缓存...")
    
    # 预热热门产品
    db = MongoDB.db
    products = await db.products.find(
        {"is_popular": True}
    ).sort("views", -1).limit(20).to_list(20)
    
    redis_client = await settings.get_redis()
    
    for product in products:
        product_id = str(product["_id"])
        await redis_client.set(
            f"product:{product_id}", 
            json.dumps(product),
            ex=3600
        )
    
    # 预热政策列表
    policies = await db.policies.find().sort("publish_date", -1).limit(10).to_list(10)
    await redis_client.set("policies:all:0:10", json.dumps(policies), ex=1800)
    
    # 预热农户故事列表
    stories = await db.farmer_stories.find().sort("created_at", -1).limit(10).to_list(10)
    await redis_client.set("farmer_stories:0:10", json.dumps(stories), ex=1800)
    
    logger.info("缓存预热完成")

# 健康检查端点
@app.get("/health")
async def health_check():
    health_data = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": settings.APP_VERSION,
        "services": {}
    }
    
    # 检查MongoDB连接
    try:
        await MongoDB.db.command("ping")
        health_data["services"]["mongodb"] = "up"
    except Exception as e:
        health_data["services"]["mongodb"] = f"down: {str(e)}"
        health_data["status"] = "degraded"
    
    # 检查Redis连接  
    try:
        redis_client = await settings.get_redis()
        await redis_client.ping()
        health_data["services"]["redis"] = "up"
    except Exception as e:
        health_data["services"]["redis"] = f"down: {str(e)}"
        health_data["status"] = "degraded"
        
    return health_data

# 注册路由
app.include_router(user_routes.router, prefix="/api/v1")
app.include_router(product_routes.router, prefix="/api/v1")
app.include_router(policy_routes.router, prefix="/api/v1")
app.include_router(farmer_story_routes.router, prefix="/api/v1")
app.include_router(upload_routes.router, prefix="/api/v1")

# 根路径重定向到文档
@app.get("/")
async def root():
    return {"message": f"欢迎使用{settings.APP_NAME} API", "docs": "/api/docs"}

# 如果直接运行此文件，则启动应用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True) 