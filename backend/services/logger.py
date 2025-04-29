import logging
import sys
from pathlib import Path
import time
from logging.handlers import RotatingFileHandler
import os
from backend.services.config import settings

# 确保日志目录存在
LOG_DIR = Path("./logs")
LOG_DIR.mkdir(exist_ok=True)

# 获取当前时间作为日志文件名一部分
current_time = time.strftime("%Y%m%d")
LOG_FILE = LOG_DIR / f"app_{current_time}.log"

# 配置日志格式
log_format = logging.Formatter(
    "[%(asctime)s] - %(levelname)s - [%(name)s:%(lineno)d] - %(message)s"
)

# 创建日志记录器
def get_logger(name: str) -> logging.Logger:
    """
    获取指定名称的日志记录器
    
    Args:
        name: 日志记录器名称，通常是模块名
        
    Returns:
        logging.Logger: 配置好的日志记录器
    """
    logger = logging.getLogger(name)
    
    # 如果已经有处理器，说明已经配置过，直接返回
    if logger.handlers:
        return logger
    
    # 设置日志级别
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # 控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(log_format)
    logger.addHandler(console_handler)
    
    # 文件处理器 - 使用RotatingFileHandler实现日志文件轮转
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(log_format)
    logger.addHandler(file_handler)
    
    # 防止日志传播到上层日志记录器
    logger.propagate = False
    
    return logger

# 默认应用日志记录器
app_logger = get_logger("app") 