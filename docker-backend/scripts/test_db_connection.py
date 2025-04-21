import mysql.connector
import os
from dotenv import load_dotenv
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def test_connection():
    try:
        # 加载环境变量
        load_dotenv()
        
        # 打印当前工作目录
        logging.info(f"当前工作目录: {os.getcwd()}")
        
        # 检查.env文件是否存在
        env_path = os.path.join(os.getcwd(), '.env')
        logging.info(f".env文件路径: {env_path}")
        if not os.path.exists(env_path):
            logging.error(".env文件不存在！")
            return False
            
        # 获取数据库配置
        db_config = {
            'host': os.getenv('MYSQL_HOST'),
            'port': int(os.getenv('MYSQL_PORT')),
            'user': os.getenv('MYSQL_USER'),
            'password': os.getenv('MYSQL_PASSWORD'),
            'database': os.getenv('MYSQL_DATABASE')
        }
        
        # 检查配置是否完整
        for key, value in db_config.items():
            if value is None:
                logging.error(f"配置缺失: {key}")
                return False
        
        logging.info("正在尝试连接数据库...")
        logging.info(f"连接信息: host={db_config['host']}, port={db_config['port']}, database={db_config['database']}")
        
        # 尝试连接数据库
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # 测试查询
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        logging.info(f"数据库连接成功！MySQL版本: {version}")
        
        # 测试表查询
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        logging.info("数据库中的表:")
        for table in tables:
            logging.info(f"- {table[0]}")
        
        # 关闭连接
        cursor.close()
        conn.close()
        logging.info("数据库连接已关闭")
        
        return True
        
    except mysql.connector.Error as err:
        logging.error(f"MySQL错误: {err}")
        return False
    except Exception as e:
        logging.error(f"发生错误: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection() 