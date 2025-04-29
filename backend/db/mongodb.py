from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from typing import Optional, Dict, Any, List
import logging
from backend.services.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db = None

    @classmethod
    async def connect_to_mongodb(cls):
        """连接到MongoDB数据库"""
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=settings.MONGODB_MAX_CONNECTIONS,
                minPoolSize=settings.MONGODB_MIN_CONNECTIONS
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]
            
            # 验证连接
            await cls.client.admin.command('ping')
            logger.info("成功连接到MongoDB")
            
            # 创建索引
            await cls._create_indexes()
            
            return cls.client
        except ConnectionFailure as e:
            logger.error(f"MongoDB连接失败: {str(e)}")
            raise

    @classmethod
    async def close_mongodb_connection(cls):
        """关闭MongoDB连接"""
        if cls.client:
            cls.client.close()
            cls.client = None
            logger.info("MongoDB连接已关闭")

    @classmethod
    async def _create_indexes(cls):
        """创建数据库索引"""
        try:
            # 用户集合索引
            await cls.db.users.create_index("username", unique=True)
            await cls.db.users.create_index("email", unique=True)
            
            # 其他索引可在这里添加
            
            logger.info("数据库索引创建成功")
        except Exception as e:
            logger.error(f"创建索引时出错: {str(e)}")
            raise

    @staticmethod
    async def get_collection(collection_name: str):
        """获取指定的集合"""
        return MongoDB.db[collection_name]

    @staticmethod
    async def find_one(collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """在集合中查找单个文档"""
        collection = MongoDB.db[collection_name]
        return await collection.find_one(query)

    @staticmethod
    async def find_many(
        collection_name: str, 
        query: Dict[str, Any],
        skip: int = 0,
        limit: int = 0,
        sort_by: Optional[List[tuple]] = None
    ) -> List[Dict[str, Any]]:
        """在集合中查找多个文档"""
        collection = MongoDB.db[collection_name]
        cursor = collection.find(query).skip(skip)
        
        if limit > 0:
            cursor = cursor.limit(limit)
            
        if sort_by:
            cursor = cursor.sort(sort_by)
            
        return await cursor.to_list(length=None)

    @staticmethod
    async def count_documents(collection_name: str, query: Dict[str, Any]) -> int:
        """计算符合条件的文档数量"""
        collection = MongoDB.db[collection_name]
        return await collection.count_documents(query)

    @staticmethod
    async def insert_one(collection_name: str, document: Dict[str, Any]) -> str:
        """插入单个文档并返回ID"""
        collection = MongoDB.db[collection_name]
        result = await collection.insert_one(document)
        return str(result.inserted_id)

    @staticmethod
    async def insert_many(collection_name: str, documents: List[Dict[str, Any]]) -> List[str]:
        """插入多个文档并返回ID列表"""
        collection = MongoDB.db[collection_name]
        result = await collection.insert_many(documents)
        return [str(id) for id in result.inserted_ids]

    @staticmethod
    async def update_one(
        collection_name: str, 
        query: Dict[str, Any], 
        update: Dict[str, Any],
        upsert: bool = False
    ) -> int:
        """更新单个文档并返回修改的文档数"""
        collection = MongoDB.db[collection_name]
        result = await collection.update_one(query, update, upsert=upsert)
        return result.modified_count

    @staticmethod
    async def update_many(
        collection_name: str, 
        query: Dict[str, Any], 
        update: Dict[str, Any]
    ) -> int:
        """更新多个文档并返回修改的文档数"""
        collection = MongoDB.db[collection_name]
        result = await collection.update_many(query, update)
        return result.modified_count

    @staticmethod
    async def delete_one(collection_name: str, query: Dict[str, Any]) -> int:
        """删除单个文档并返回删除的文档数"""
        collection = MongoDB.db[collection_name]
        result = await collection.delete_one(query)
        return result.deleted_count

    @staticmethod
    async def delete_many(collection_name: str, query: Dict[str, Any]) -> int:
        """删除多个文档并返回删除的文档数"""
        collection = MongoDB.db[collection_name]
        result = await collection.delete_many(query)
        return result.deleted_count

    @staticmethod
    async def aggregate(collection_name: str, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """执行聚合操作并返回结果"""
        collection = MongoDB.db[collection_name]
        return await collection.aggregate(pipeline).to_list(length=None) 