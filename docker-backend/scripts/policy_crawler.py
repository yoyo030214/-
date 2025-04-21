import requests
from bs4 import BeautifulSoup
import logging
import mysql.connector
from datetime import datetime
import re
import sys

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('policy_crawler.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class PolicyCrawler:
    def __init__(self):
        self.base_url = "http://www.moa.gov.cn/gk/zcfg/"
        self.db = self.connect_db()
        self.create_table()
        
    def connect_db(self):
        try:
            db = mysql.connector.connect(
                host="175.178.80.222",
                user="Administrator",
                password="lol110606YY.",
                database="agriculture"
            )
            logging.info("成功连接到MySQL服务器")
            return db
        except Exception as e:
            logging.error(f"数据库连接失败: {str(e)}")
            raise

    def create_table(self):
        try:
            cursor = self.db.cursor()
            
            # 先删除旧表
            drop_sql = "DROP TABLE IF EXISTS policies"
            cursor.execute(drop_sql)
            
            # 创建新表
            sql = """
            CREATE TABLE policies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                link VARCHAR(255) NOT NULL,
                publish_date DATE,
                content TEXT,
                policy_type VARCHAR(50),
                status VARCHAR(20) DEFAULT 'published',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_link (link)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
            cursor.execute(sql)
            self.db.commit()
            logging.info("成功创建或更新policies表")
        except Exception as e:
            logging.error(f"创建表失败: {str(e)}")
            raise

    def normalize_url(self, url):
        # 移除多余的 ../ 和错误的域名格式
        url = url.replace('http://www.moa.gov.cn.', 'http://www.moa.gov.cn')
        url = url.replace('http://www.moa.gov.cn/', 'http://www.moa.gov.cn')
        url = re.sub(r'\.\./', '', url)
        url = url.replace('./', '')
        
        # 处理域名和路径之间的问题
        if 'www.moa.gov.cn' in url:
            parts = url.split('www.moa.gov.cn')
            if len(parts) > 1:
                url = 'http://www.moa.gov.cn' + parts[1]
        
        # 确保以 http:// 开头
        if not url.startswith('http'):
            url = 'http://www.moa.gov.cn/' + url.lstrip('/')
            
        # 移除多余的斜杠
        url = re.sub(r'([^:])//+', r'\1/', url)
        
        return url

    def fetch_page(self, url):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            response.encoding = 'utf-8'
            logging.info(f"成功获取页面: {url}")
            return response.text
        except Exception as e:
            logging.error(f"获取页面失败: {str(e)}")
            return None

    def parse_policy_type(self, title):
        keywords = {
            'planting': ['种植', '农作物', '粮食', '蔬菜', '水果'],
            'breeding': ['养殖', '畜牧', '渔业', '水产'],
            'rural_development': ['乡村振兴', '农村发展', '农业现代化'],
            'technology': ['科技', '创新', '智慧农业'],
            'market': ['市场', '流通', '价格', '贸易'],
            'environment': ['生态', '环保', '绿色', '可持续'],
            'finance': ['金融', '补贴', '保险', '信贷'],
            'quality': ['质量', '安全', '标准', '检测'],
            'other': []
        }
        
        for policy_type, kws in keywords.items():
            if any(kw in title for kw in kws):
                return policy_type
        return 'other'

    def parse_policy_content(self, html):
        if not html:
            return None
            
        soup = BeautifulSoup(html, 'html.parser')
        
        # 尝试多个可能的内容容器
        content_selectors = [
            'div.TRS_Editor',
            'div.content',
            'div.article-content',
            'div#zoom',
            'div.Custom_UnionStyle',
            'div.pages_content',
            'div.TRS_PreAppend',
            'div.TRS_Editor p',
            'div.content p',
            'div.article p',
            'div.article-content p',
            'div#zoom p',
            'div.wrap',
            'div.article',
            'div.TRS_PreAppend p'
        ]
        
        for selector in content_selectors:
            try:
                if 'p' in selector:
                    # 如果选择器包含 p 标签，获取所有匹配的段落
                    elements = soup.select(selector)
                    if elements:
                        content = '\n'.join([p.get_text(strip=True) for p in elements if p.get_text(strip=True)])
                        if content:
                            return content
                else:
                    # 否则获取整个容器的内容
                    content_div = soup.select_one(selector)
                    if content_div:
                        # 移除脚本和样式标签
                        for script in content_div(['script', 'style']):
                            script.decompose()
                            
                        # 获取所有段落文本
                        paragraphs = content_div.find_all(['p', 'div.TRS_Editor', 'div.content', 'div.article'])
                        if paragraphs:
                            content = '\n'.join([p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)])
                            if content:
                                return content
                                
                        # 如果没有找到段落，获取所有文本
                        content = content_div.get_text(strip=True)
                        if content:
                            return content
            except Exception as e:
                logging.error(f"解析内容时出错: {str(e)}")
                continue
                    
        # 如果上述方法都失败，尝试直接获取正文内容
        try:
            body = soup.find('body')
            if body:
                # 移除页眉页脚等无关内容
                for elem in body.select('header, footer, nav, script, style'):
                    elem.decompose()
                    
                # 获取所有文本内容
                content = body.get_text(strip=True)
                if content:
                    return content
        except Exception as e:
            logging.error(f"解析正文时出错: {str(e)}")
            
        return None

    def save_policy(self, title, link, date, content):
        try:
            cursor = self.db.cursor()
            
            # 检查是否已存在
            check_sql = "SELECT id FROM policies WHERE link = %s"
            cursor.execute(check_sql, (link,))
            existing = cursor.fetchone()
            
            if existing:
                # 更新现有记录
                update_sql = """
                UPDATE policies 
                SET content = %s, 
                    policy_type = %s,
                    updated_at = NOW()
                WHERE link = %s
                """
                policy_type = self.parse_policy_type(title)
                cursor.execute(update_sql, (content, policy_type, link))
            else:
                # 插入新记录
                insert_sql = """
                INSERT INTO policies (title, link, publish_date, content, policy_type)
                VALUES (%s, %s, %s, %s, %s)
                """
                policy_type = self.parse_policy_type(title)
                cursor.execute(insert_sql, (title, link, date, content, policy_type))
                
            self.db.commit()
            logging.info(f"成功保存政策: {title}")
            return True
        except Exception as e:
            logging.error(f"保存政策失败: {str(e)}")
            self.db.rollback()
            return False

    def parse_policy(self, html):
        if not html:
            return

        soup = BeautifulSoup(html, 'html.parser')
        policy_lists = soup.find_all('ul', class_='commonlist')
        logging.info(f"找到 {len(policy_lists)} 个政策列表")

        for policy_list in policy_lists:
            items = policy_list.find_all('li')
            logging.info(f"当前列表中找到 {len(items)} 个政策项")

            for item in items:
                try:
                    title = item.find('a').text.strip()
                    link = item.find('a')['href']
                    date_span = item.find('span')
                    date = date_span.text.strip() if date_span else None

                    # 规范化链接
                    link = self.normalize_url(link)
                    
                    logging.info(f"处理政策: {title}")
                    logging.info(f"链接: {link}")
                    logging.info(f"日期: {date}")

                    # 获取政策详情
                    detail_html = self.fetch_page(link)
                    if detail_html:
                        content = self.parse_policy_content(detail_html)
                        if content:
                            self.save_policy(title, link, date, content)
                        else:
                            logging.warning(f"未找到政策内容: {title}")
                    else:
                        logging.error(f"获取政策详情失败: {link}")

                except Exception as e:
                    logging.error(f"处理政策项时出错: {str(e)}")
                    continue

    def crawl(self):
        try:
            logging.info("开始抓取政策...")
            html = self.fetch_page(self.base_url)
            if html:
                self.parse_policy(html)
            logging.info("政策抓取完成")
        except Exception as e:
            logging.error(f"抓取过程中出错: {str(e)}")
        finally:
            if hasattr(self, 'db') and self.db:
                self.db.close()

if __name__ == "__main__":
    crawler = PolicyCrawler()
    crawler.crawl() 