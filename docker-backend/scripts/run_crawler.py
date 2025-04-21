import schedule
import time
from policy_crawler import PolicyCrawler
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler_scheduler.log'),
        logging.StreamHandler()
    ]
)

def run_crawler():
    """运行政策抓取器"""
    try:
        crawler = PolicyCrawler()
        crawler.crawl()
    except Exception as e:
        logging.error(f"运行抓取器失败: {str(e)}")

def main():
    # 每天凌晨2点运行一次
    schedule.every().day.at("02:00").do(run_crawler)
    
    logging.info("政策抓取定时任务已启动")
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main() 