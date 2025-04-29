from motor.motor_asyncio import AsyncIOMotorClient
from redis import Redis
import logging
from .config import settings
from pymongo.errors import ConnectionFailure
from backend.services.logger import get_logger

# 配置日志记录器
logger = get_logger("database")

# MongoDB连接
mongo_client = None
mongo_db = None

# Redis连接
redis_client = None

class Database:
    """MongoDB数据库连接服务类"""
    
    def __init__(self):
        self.client = None
        self.db = None
        self._connected = False
        
    async def connect(self):
        """
        连接到MongoDB数据库
        """
        if self._connected:
            return
            
        try:
            # 创建MongoDB连接
            logger.info("正在连接MongoDB数据库...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=settings.MONGODB_MAX_CONNECTIONS,
                minPoolSize=settings.MONGODB_MIN_CONNECTIONS
            )
            
            # 获取数据库实例
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            # 测试连接是否成功
            await self.client.admin.command('ping')
            self._connected = True
            logger.info(f"MongoDB数据库连接成功: {settings.MONGODB_DB_NAME}")
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB数据库连接失败: {e}")
            raise
        except Exception as e:
            logger.error(f"MongoDB数据库连接过程中发生错误: {e}")
            raise
    
    async def close(self):
        """
        关闭数据库连接
        """
        if self.client and self._connected:
            logger.info("关闭MongoDB数据库连接...")
            self.client.close()
            self._connected = False
            logger.info("MongoDB数据库连接已关闭")
    
    def get_collection(self, collection_name: str):
        """
        获取指定集合
        
        Args:
            collection_name: 集合名称
            
        Returns:
            集合对象
        """
        if not self._connected:
            logger.warning("获取集合前数据库未连接")
            return None
            
        return self.db[collection_name]

# 创建数据库实例
db = Database()

async def connect_to_mongo():
    """连接到MongoDB数据库"""
    global mongo_client, mongo_db
    try:
        mongo_client = AsyncIOMotorClient(settings.MONGODB_URL)
        mongo_db = mongo_client[settings.MONGODB_DB_NAME]
        logger.info("连接到MongoDB成功！")
        
        # 创建索引
        await create_indexes()
    except Exception as e:
        logger.error(f"连接MongoDB失败: {str(e)}")
        raise e

async def disconnect_from_mongo():
    """断开与MongoDB的连接"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB连接已关闭！")

def connect_to_redis():
    """连接到Redis数据库"""
    global redis_client
    try:
        redis_client = Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        # 测试连接
        redis_client.ping()
        logger.info("连接到Redis成功！")
    except Exception as e:
        logger.error(f"连接Redis失败: {str(e)}")
        redis_client = None

def disconnect_from_redis():
    """断开与Redis的连接"""
    global redis_client
    if redis_client:
        redis_client.close()
        logger.info("Redis连接已关闭！")

async def create_indexes():
    """为集合创建索引"""
    try:
        # 用户集合索引
        await mongo_db.users.create_index("email", unique=True)
        await mongo_db.users.create_index("username")
        
        # 产品集合索引
        await mongo_db.products.create_index("name")
        await mongo_db.products.create_index("category")
        
        # 农民故事索引
        await mongo_db.farmer_stories.create_index("author")
        await mongo_db.farmer_stories.create_index("created_at")
        
        # 政策信息索引
        await mongo_db.policies.create_index("title")
        await mongo_db.policies.create_index("publish_date")
        
        logger.info("MongoDB索引创建成功！")
    except Exception as e:
        logger.error(f"创建索引失败: {str(e)}")

def get_db():
    """获取数据库实例"""
    return mongo_db

def get_redis():
    """获取Redis实例"""
    return redis_client 