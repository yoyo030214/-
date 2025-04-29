import os
from typing import Optional, Dict, Any, List
from pydantic import BaseSettings
from dotenv import load_dotenv
import redis.asyncio as redis

# 加载环境变量
load_dotenv()

class Settings(BaseSettings):
    """应用程序设置"""
    
    # 应用信息
    APP_NAME: str = "AI应用平台"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    API_V1_PREFIX: str = "/api/v1"
    
    # MongoDB配置
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "ai_platform")
    MONGODB_MAX_CONNECTIONS: int = int(os.getenv("MONGODB_MAX_CONNECTIONS", "10"))
    MONGODB_MIN_CONNECTIONS: int = int(os.getenv("MONGODB_MIN_CONNECTIONS", "1"))
    
    # Redis配置
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    
    # JWT配置
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24小时
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # 文件上传配置
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "pdf", "txt", "md"]
    
    # CORS设置
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
    ]
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = "logs/app.log"
    
    # 缓存配置
    CACHE_TTL: int = 60 * 60  # 默认1小时
    
    # AI服务配置
    AI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    AI_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "gpt-3.5-turbo")
    
    # 邮件服务配置
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    
    # 用户设置
    DEFAULT_USER_ROLE: str = "user"
    DEFAULT_USER_STATUS: str = "active"
    
    # 第三方API设置
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY")
    
    # Redis客户端实例
    _redis_client = None
    
    async def get_redis(self):
        """获取Redis客户端"""
        if self._redis_client is None:
            redis_url = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
            if self.REDIS_PASSWORD:
                redis_url = f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
            self._redis_client = redis.from_url(redis_url, decode_responses=True)
        return self._redis_client
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# 创建设置实例
settings = Settings()

# 环境变量辅助函数
def get_env_variable(name: str, default: Any = None) -> Any:
    """获取环境变量，如果不存在则返回默认值"""
    return os.getenv(name, default)

def get_boolean_env(name: str, default: bool = False) -> bool:
    """获取布尔类型的环境变量"""
    value = os.getenv(name, str(default)).lower()
    return value in ("true", "1", "t", "yes", "y")

# 额外配置
PRODUCTION_MODE = os.getenv("ENVIRONMENT", "development") == "production"

# 文件类型验证
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"]
ALLOWED_DOCUMENT_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

# 缓存过期时间（秒）
CACHE_EXPIRY = {
    "products": 600,        # 10分钟
    "policies": 1800,       # 30分钟
    "farmer_stories": 1800, # 30分钟
    "user_profile": 3600,   # 1小时
}

# 初始化上传目录
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 