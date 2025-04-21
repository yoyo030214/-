import mysql.connector
import traceback

try:
    # 直接使用配置信息
    config = {
        'host': '175.178.80.222',
        'port': 3306,
        'user': 'Administrator',
        'password': 'lol110606YY.',
        'database': 'agriculture'
    }
    
    print("正在连接数据库...")
    print(f"配置信息: {config}")
    
    # 尝试连接
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor()
    
    # 测试查询
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"数据库连接成功！MySQL版本: {version[0]}")
    
    # 查看表
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("\n数据库中的表:")
    for table in tables:
        print(f"- {table[0]}")
    
    # 查看政策数据
    print("\n政策数据:")
    cursor.execute("SELECT id, title, type, publish_date FROM policies ORDER BY publish_date DESC LIMIT 5")
    policies = cursor.fetchall()
    for policy in policies:
        print(f"- ID: {policy[0]}, 标题: {policy[1]}, 类型: {policy[2]}, 发布日期: {policy[3]}")
    
    # 关闭连接
    cursor.close()
    conn.close()
    print("\n数据库连接已关闭")
    
except mysql.connector.Error as err:
    print(f"MySQL错误: {err}")
    print("错误详情:")
    print(traceback.format_exc())
except Exception as e:
    print(f"发生错误: {str(e)}")
    print("错误详情:")
    print(traceback.format_exc()) 